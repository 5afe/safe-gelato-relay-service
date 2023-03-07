import { Module } from '@nestjs/common';
import { GelatoSponsorService } from './gelato.sponsor.service';
import { SponsorService } from './sponsor.service.interface';

@Module({
  providers: [{ provide: SponsorService, useClass: GelatoSponsorService }],
  exports: [SponsorService],
})
export class SponsorModule {}
