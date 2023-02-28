import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerStorageService } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';

@Injectable()
export class RelayLimitService {
  /** Time to limit in seconds */
  private readonly ttl: number;

  /** Number of relay requests per ttl */
  private readonly limit: number;

  constructor(
    private readonly throttlerService: ThrottlerStorageService,
    private readonly configService: ConfigService,
  ) {
    this.ttl = configService.getOrThrow('relay.ttl');
    this.limit = configService.getOrThrow('relay.limit');
  }

  private generateKey(chainId: string, address: string) {
    return `${chainId}:${address}`;
  }

  public getRelayLimit(
    chainId: string,
    address: string,
  ): {
    remaining: number;
    expiresAt?: number;
  } {
    const key = this.generateKey(chainId, address);
    const throttlerEntry = this.throttlerService.storage[key] || {
      totalHits: 0,
    };

    return {
      remaining: Math.max(0, this.limit - throttlerEntry.totalHits),
      expiresAt: throttlerEntry.expiresAt,
    };
  }

  public canRelay(chainId: string, address: string): boolean {
    const { remaining } = this.getRelayLimit(chainId, address);

    return remaining !== 0;
  }

  public async increment(
    chainId: string,
    address: string,
  ): Promise<ThrottlerStorageRecord> {
    const key = this.generateKey(chainId, address);
    return this.throttlerService.increment(key, this.ttl);
  }
}
