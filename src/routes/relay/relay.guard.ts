import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { isAddress } from 'ethers';

export const getRelayThrottlerGuardStorageKey = (
  chainId: string,
  address: string,
) => {
  return `${chainId}:${address}`;
};

@Injectable()
export class RelayThrottlerGuard extends ThrottlerGuard {
  /**
   * Overwrite tracker to rate limit based on the (Safe) target address
   */
  getTracker(req: Record<string, any>) {
    return req.body.target;
  }

  /**
   * This is the key used to store the rate limit in the storage service
   */
  generateKey(context: ExecutionContext): string {
    const { body } = context.switchToHttp().getRequest();
    return getRelayThrottlerGuardStorageKey(body.chainId, body.target);
  }

  /**
   * If the request contains a valid target, we rate limit based on that address.
   * Otherwise we allow the request, because it will otherwise throw during validation.
   * @see https://github.com/nestjs/throttler/blob/master/src/throttler.guard.ts#L62
   */
  handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
  ): Promise<boolean> {
    const { req } = this.getRequestResponse(context);
    const tracker = this.getTracker(req);

    // TODO: Add rate limit bypass on staging
    if (isAddress(tracker)) {
      return super.handleRequest(context, limit, ttl);
    } else {
      // Skip rate limiting
      return Promise.resolve(true);
    }
  }
}
