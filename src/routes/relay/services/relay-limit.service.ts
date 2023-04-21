import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

import {
  CacheService,
  ICacheService,
} from '../../../datasources/cache/cache.service.interface';

@Injectable()
export class RelayLimitService {
  // Time to limit in seconds
  private readonly ttl: number;

  // Number of relay requests per ttl
  private readonly limit: number;

  constructor(
    private readonly configService: ConfigService,
    @Inject(CacheService) private readonly cacheService: ICacheService,
  ) {
    this.ttl = this.configService.getOrThrow<number>('relay.ttl');
    this.limit = this.configService.getOrThrow<number>('relay.limit');
  }

  /**
   * Generate key for caching number of relays
   */
  private generateKey(chainId: string, address: string) {
    return `${chainId}:${ethers.getAddress(address)}`;
  }

  /**
   * Get the number of cached attempts for an address
   */
  private async getCachedAttempts(
    chainId: string,
    address: string,
  ): Promise<number> {
    const DEFAULT_ATTEMPTS = 0;

    const key = this.generateKey(chainId, address);
    const attempts = await this.cacheService.get(key);

    return typeof attempts === 'string'
      ? // If attempts is not a number, return default
        Number(attempts) || DEFAULT_ATTEMPTS
      : DEFAULT_ATTEMPTS;
  }

  /**
   * Set the number of attempts for an address in cache
   */
  private async setCachedAttempts(
    chainId: string,
    address: string,
    attempts: number,
  ): Promise<void> {
    const key = this.generateKey(chainId, address);
    return this.cacheService.set(key, attempts.toString(), this.ttl);
  }

  /**
   * Get the current relay limit for an address
   */
  public async getRelayLimit(
    chainId: string,
    address: string,
  ): Promise<{
    limit: number;
    remaining: number;
  }> {
    const attempts = await this.getCachedAttempts(chainId, address);

    return {
      limit: this.limit,
      remaining: Math.max(0, this.limit - attempts),
    };
  }

  /**
   * Check if addresses can relay
   */
  public async canRelay(
    chainId: string,
    addresses: Array<string>,
  ): Promise<boolean> {
    const attempts = await Promise.all(
      addresses.map((address) => this.getCachedAttempts(chainId, address)),
    );
    return attempts.every((attempts) => attempts < this.limit);
  }

  /**
   * Increment the number of relays for addresses
   */
  public async increment(
    chainId: string,
    addresses: Array<string>,
  ): Promise<void> {
    await Promise.allSettled(
      addresses.map(async (address) => {
        const currentAttempts = await this.getCachedAttempts(chainId, address);
        const incremented = currentAttempts + 1;
        return this.setCachedAttempts(chainId, address, incremented);
      }),
    );
  }
}
