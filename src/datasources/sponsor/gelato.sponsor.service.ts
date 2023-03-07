import { GelatoRelay, RelayResponse } from '@gelatonetwork/relay-sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SponsoredCallDto } from '../../routes/relay/entities/sponsored-call.entity';
import { ISponsorService } from './sponsor.service.interface';

@Injectable()
export class GelatoSponsorService implements ISponsorService {
  private readonly relayer = new GelatoRelay();

  constructor(private readonly configService: ConfigService) {}

  /**
   * If you are using your own custom gas limit, please add a 150k gas buffer on top of the expected
   * gas usage for the transaction. This is for the Gelato Relay execution overhead, and adding this
   * buffer reduces your chance of the task cancelling before it is executed on-chain.
   * @see https://docs.gelato.network/developer-services/relay/quick-start/optional-parameters
   */
  private getRelayGasLimit(gasLimit?: string): string | undefined {
    const GAS_LIMIT_BUFFER = 150_000;

    if (!gasLimit) {
      return undefined;
    }

    return (BigInt(gasLimit) + BigInt(GAS_LIMIT_BUFFER)).toString();
  }

  /**
   * Relays transaction data via Gelato's `sponsoredCall`
   */
  async sponsoredCall(
    sponsoredCallDto: SponsoredCallDto,
  ): Promise<RelayResponse> {
    const { chainId, data, to, gasLimit } = sponsoredCallDto;

    const apiKey = this.configService.getOrThrow(`gelato.apiKey.${chainId}`);

    return this.relayer.sponsoredCall({ chainId, data, target: to }, apiKey, {
      gasLimit: this.getRelayGasLimit(gasLimit),
    });
  }
}
