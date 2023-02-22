import { GelatoRelay, RelayResponse } from '@gelatonetwork/relay-sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SponsoredCallDto } from './entities/sponsored-call.entity';

@Injectable()
export class RelayService {
  private readonly relayer: GelatoRelay;

  constructor(private configService: ConfigService) {
    this.relayer = new GelatoRelay();
  }

  /**
   * Relays transaction data via Gelato `sponsoredCall`
   * Validation takes place through ZodValidationPipe in controller
   */
  sponsoredCall({
    chainId,
    data,
    target,
    gasLimit,
  }: SponsoredCallDto): Promise<RelayResponse> {
    // TODO: Check that `target` is a Safe

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
        gasLimit,
      },
    );
  }
}
