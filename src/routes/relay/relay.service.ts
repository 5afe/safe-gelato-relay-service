import { GelatoRelay, RelayResponse } from '@gelatonetwork/relay-sdk';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectThrottlerStorage, ThrottlerStorage } from '@nestjs/throttler';

import { SafeInfoHelper } from '../common/safe/safe-info.helper';
import { SponsoredCallDto } from './entities/sponsored-call.entity';

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
    private readonly safeInfoHelper: SafeInfoHelper,
    @InjectThrottlerStorage()
    private readonly storageService: ThrottlerStorage,
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
    target,
    gasLimit,
  }: SponsoredCallDto): Promise<RelayResponse> {
    // Avoid relaying of non-Safe contracts with the same ABI
    if (!(await this.safeInfoHelper.isSafe(chainId, target))) {
      throw {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `${target} is not a Safe on chain ${chainId}`,
      };
    }

    const apiKey = this.configService.getOrThrow(`gelato.apiKey.${chainId}`);

    // Relay
    return this.relayer.sponsoredCall(
      {
        chainId,
        data,
        target,
      },
      apiKey,
      {
        gasLimit: _getRelayGasLimit(gasLimit),
      },
    );
  }

  /**
   * Current rate limit for a target address
   */
  getRelayLimit(target: string): {
    remaining: number;
    expiresAt?: number;
  } {
    const limit = this.configService.getOrThrow<number>('throttle.limit');

    const { totalHits, expiresAt } = this.storageService.storage[target] || {};

    return {
      remaining: totalHits ? Math.max(limit - totalHits, 0) : limit,
      expiresAt,
    };
  }
}
