import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SponsoredCallDto } from './entities/sponsored-call.entity';

@Injectable()
export class RelayService {
  constructor(private configService: ConfigService) {}

  getHello(): string {
    const name = this.configService.getOrThrow<string>('about.name');
    return `Hello from the ${name}!`;
  }

  sponsoredCall(sponsoredCallDto: SponsoredCallDto): SponsoredCallDto {
    return sponsoredCallDto;
  }
}
