import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerStorageService } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import {
  ILoggingService,
  LoggingService,
} from '../../common/logging/logging.interface';

@Injectable()
export class RelayLimitService {
  // Time to limit in seconds
  private readonly ttl: number;

  // Number of relay requests per ttl
  private readonly limit: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly throttlerStorageService: ThrottlerStorageService,
    @Inject(LoggingService) private readonly loggingService: ILoggingService,
  ) {
    this.ttl = this.configService.getOrThrow<number>('relay.ttl');
    this.limit = this.configService.getOrThrow<number>('relay.limit');
  }

  /**
   * Generate key for caching number of relays
   */
  private generateKey(chainId: string, address: string) {
    return `${chainId}:${address}`;
  }

  /**
   * Get the current relay limit for an address
   */
  public getRelayLimit(
    chainId: string,
    address: string,
  ): {
    remaining: number;
    expiresAt?: number;
  } {
    const key = this.generateKey(chainId, address);
    const throttlerEntry = this.throttlerStorageService.storage[key] || {
      totalHits: 0,
    };

    return {
      remaining: Math.max(0, this.limit - throttlerEntry.totalHits),
      expiresAt: throttlerEntry.expiresAt,
    };
  }

  /**
   * Check if an address can relay
   */
  public canRelay(chainId: string, address: string): boolean {
    const limit = this.getRelayLimit(chainId, address);
    // TODO: Add relay bypass for staging
    return limit.remaining > 0;
  }

  /**
   * Increment the number of relays for an address
   */
  public async increment(
    chainId: string,
    address: string,
  ): Promise<ThrottlerStorageRecord> {
    const key = this.generateKey(chainId, address);
    return await this.throttlerStorageService.increment(key, this.ttl);
  }
}
