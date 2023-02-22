import { isAddress, isHexString } from 'ethers';
import { z } from 'zod';

const NUMERIC_REGEX = /^\d+$/;

export const SponsoredCallSchema = z.object({
  chainId: z.string().regex(NUMERIC_REGEX),
  target: z.string().refine(isAddress),
  data: z.string().refine(isHexString),
});
