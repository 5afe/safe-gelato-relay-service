import { GelatoRelay, RelayResponse } from '@gelatonetwork/relay-sdk';
import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SponsoredCallDto } from './entities/sponsored-call.entity';
import { RelayLimitService } from './services/relay-limit.service';

/**
 * If you are using your own custom gas limit, please add a 150k gas buffer on top of the expected
 * gas usage for the transaction. This is for the Gelato Relay execution overhead, and adding this
 * buffer reduces your chance of the task cancelling before it is executed on-chain.
 * @see https://docs.gelato.network/developer-services/relay/quick-start/optional-parameters
 */
export const _getRelayGasLimit = (gasLimit?: string): bigint | undefined => {
  const GAS_LIMIT_BUFFER = 150_000;

  if (!gasLimit) {
    return undefined;
  }

  return BigInt(gasLimit) + BigInt(GAS_LIMIT_BUFFER);
};

@Injectable()
export class RelayService {
  private readonly relayer: GelatoRelay;

  constructor(
    private readonly configService: ConfigService,
    private readonly relayLimitService: RelayLimitService,
  ) {
    this.relayer = new GelatoRelay();
  }

  /**
   * Relays transaction data via Gelato `sponsoredCall`
   * Validation takes place through ZodValidationPipe in controller
   */
  async sponsoredCall({
    chainId,
    data,
    to,
    gasLimit,
  }: SponsoredCallDto): Promise<RelayResponse> {
    const apiKey = this.configService.getOrThrow(`gelato.apiKey.${chainId}`);

    // Check rate limit is not reached
    if (!this.relayLimitService.canRelay(chainId, to)) {
      throw new BadRequestException({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Relay limit reached',
      });
    }

    let response: RelayResponse;

    try {
      // Relay
      response = await this.relayer.sponsoredCall(
        { chainId, data, target: to },
        apiKey,
        { gasLimit: _getRelayGasLimit(gasLimit) },
      );
    } catch (err) {
      throw new BadRequestException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Relay failed',
        cause: err,
      });
    }

    // Increase the counter
    await this.relayLimitService.incrementRelays(chainId, to);

    // TODO: Add rate limit headers
    return response;
  }
}
