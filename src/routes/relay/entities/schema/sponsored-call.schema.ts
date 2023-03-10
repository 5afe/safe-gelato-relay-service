import { z } from 'zod';

import { AddressSchema } from '../../../common/schema/address.schema';
import { ChainIdSchema } from '../../../common/schema/chain-id.schema';
import {
  isValidMultiSendCall,
  isExecTransactionCall,
  getSafeAddressFromMultiSend,
} from './sponsored-call.schema.helper';

export const SponsoredCallSchema = z
  .object({
    chainId: ChainIdSchema,
    to: AddressSchema,
    data: z.string(),
    gasLimit: z.optional(z.string().regex(/^\d+$/)).transform((value) => {
      return value ? BigInt(value) : undefined;
    }),
  })
  .transform(async (values, ctx) => {
    const { chainId, to, data } = values;

    const setError = (message: string) => {
      ctx.addIssue({
        message,
        path: ['data'],
        code: z.ZodIssueCode.custom,
      });
    };

    if (isExecTransactionCall(data)) {
      return {
        ...values,
        safeAddress: to,
      };
    }

    // MultiSend not containing only `execTransaction` calls
    if (isValidMultiSendCall(chainId, to, data)) {
      const safeAddress = getSafeAddressFromMultiSend(data);

      if (!safeAddress) {
        setError('Cannot decode Safe address from `multiSend` transaction');

        return z.NEVER;
      }

      return {
        ...values,
        safeAddress,
      };
    }

    setError('Only (batched) Safe transactions can be relayed');

    return z.NEVER;
  });
