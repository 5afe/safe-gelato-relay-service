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
   * Override reference value in order to rate limit based on chain ID and address
   */
  getTracker({ body }: Record<string, any>) {
    return getRelayThrottlerGuardStorageKey(body.chainId, body.target);
  }

  /**
   * Key used to store the rate limit details under in ThrottlerStorage
   */
  generateKey(context: ExecutionContext): string {
    const req = context.switchToHttp().getRequest();
    return this.getTracker(req);
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

    // TODO: Add rate limit bypass on staging
    if (isAddress(req.body.target)) {
      return super.handleRequest(context, limit, ttl);
    } else {
      // Skip rate limiting
      return Promise.resolve(true);
    }
  }
}
