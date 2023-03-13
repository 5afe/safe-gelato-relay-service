import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  NetworkService,
  INetworkService,
} from '../network/network.service.interface';
import { ISafeInfoService } from './safe-info.service.interface';

@Injectable()
export class GatewaySafeInfoService implements ISafeInfoService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(NetworkService) private readonly networkService: INetworkService,
  ) {}

  async isSafeContract(chainId: string, address: string): Promise<boolean> {
    try {
      const gatewayUrl = this.configService.getOrThrow<string>('gatewayUrl');
      await this.networkService.get(
        `${gatewayUrl}/v1/chains/${chainId}/safes/${address}`,
      );

      return true;
    } catch {
      return false;
    }
  }
}
