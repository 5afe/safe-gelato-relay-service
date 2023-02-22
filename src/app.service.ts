import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getHello(): string {
    const name = this.configService.getOrThrow<string>('about.name');
    return `Hello from the ${name}!`;
  }
}
