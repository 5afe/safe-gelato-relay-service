import { Global, Module } from '@nestjs/common';

import { SponsorService, ISponsorService } from '../sponsor.service.interface';

const sponsorService: ISponsorService = {
  sponsoredCall: jest.fn(),
};

const mockSponsorService = jest.mocked(sponsorService);

@Global()
@Module({
  providers: [{ provide: SponsorService, useValue: mockSponsorService }],
  exports: [SponsorService],
})
export class TestSponsorModule {}
