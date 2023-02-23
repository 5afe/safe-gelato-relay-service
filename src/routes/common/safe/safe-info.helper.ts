import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SafeInfoHelper {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Note: if we expose this, install `@safe-global/safe-gateway-typescript-sdk`
   * and use `SafeInfo` as return type
   */
  private async getSafeInfo(
    chainId: string,
    address: string,
  ): Promise<unknown> {
    const gatewayUrl = this.configService.getOrThrow('gatewayUrl');
    const { data } = await axios.get(
      `${gatewayUrl}/v1/chains/${chainId}/safes/${address}`,
    );
    return data;
  }

  /**
   * Checks if given address is a Safe on specified chain
   * @param chainId
   * @param address
   * @returns boolean
   */
  async isSafe(chainId: string, address: string): Promise<boolean> {
    try {
      return !!(await this.getSafeInfo(chainId, address));
    } catch {
      return false;
    }
  }
}
