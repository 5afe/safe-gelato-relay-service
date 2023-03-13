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

    // `execTransaction`
    if (isExecTransactionCall(data)) {
      return {
        ...values,
        safeAddress: to,
      };
    }

    if (!isValidMultiSendCall(chainId, to, data)) {
      setError('Only (batched) Safe transactions can be relayed');
      return z.NEVER;
    }

    const safeAddress = getSafeAddressFromMultiSend(data);
    if (!safeAddress) {
      setError('Cannot decode Safe address from `multiSend` transaction');
      return z.NEVER;
    }

    // `multiSend`
    return {
      ...values,
      safeAddress,
    };
  });
