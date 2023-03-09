import { SponsoredCallDto } from '../../routes/relay/entities/sponsored-call.entity';

export const SponsorService = Symbol('ISponsorService');

export interface ISponsorService {
  sponsoredCall(
    sponsoredCallDto: SponsoredCallDto,
  ): Promise<{ taskId: string }>;
}
