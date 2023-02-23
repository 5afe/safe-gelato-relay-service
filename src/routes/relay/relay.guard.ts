import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { isAddress } from 'ethers';

@Injectable()
export class RelayThrottlerGuard extends ThrottlerGuard {
  /**
   * Overwrite tracker to rate limit based on the (Safe) target address
   */
  getTracker(req: Record<string, any>) {
    return req.body.target;
  }

  /**
   * We only use the Safe address as target because we want to read throttle storage.
   */
  generateKey(_: ExecutionContext, target: string): string {
    return target;
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

    if (isAddress(tracker)) {
      return super.handleRequest(context, limit, ttl);
    } else {
      // Skip rate limiting
      return Promise.resolve(true);
    }
  }
}
