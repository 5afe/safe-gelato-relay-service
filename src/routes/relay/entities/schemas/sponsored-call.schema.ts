import { isAddress, isHexString } from 'ethers';
import { z } from 'zod';

import { SupportedChainId } from '../../../../config/constants';

export const SponsoredCallSchema = z.object({
  chainId: z.nativeEnum(SupportedChainId),
  target: z.string().refine(isAddress),
  data: z.string().refine(isHexString),
  gasLimit: z.optional(z.string().regex(/^\d+$/)),
});
