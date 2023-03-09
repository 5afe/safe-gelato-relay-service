import { Global, Module } from '@nestjs/common';
import { GelatoRelay } from '@gelatonetwork/relay-sdk';

import { GelatoSponsorService } from './gelato.sponsor.service';
import { SponsorService } from './sponsor.service.interface';

@Global()
@Module({
  providers: [
    {
      provide: 'GelatoRelay',
      useFactory: () => {
        return new GelatoRelay();
      },
    },
    { provide: SponsorService, useClass: GelatoSponsorService },
  ],
  exports: [SponsorService],
})
export class SponsorModule {}
