import { z } from 'zod';

import { AddressSchema } from '../../../common/schema/address.schema';
import { ChainIdSchema } from '../../../common/schema/chain-id.schema';
import {
  isValidMultiSendCall,
  isExecTransactionCall,
  getSafeAddressFromMultiSend,
  isValidSetupCall,
  getOwnersFromSetup,
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
        limitAddresses: [to],
      };
    }

    // `multiSend`
    if (isValidMultiSendCall(chainId, to, data)) {
      const safeAddress = getSafeAddressFromMultiSend(data);
      if (!safeAddress) {
        setError('Cannot decode Safe address from `multiSend` transaction');
        return z.NEVER;
      }

      return {
        ...values,
        limitAddresses: [safeAddress],
      };
    }

    // `setup`
    if (isValidSetupCall(chainId, to, data)) {
      return {
        ...values,
        limitAddresses: getOwnersFromSetup(data),
      };
    }

    setError(
      'Only Safe creation or (batched) Safe transactions can be relayed',
    );
    return z.NEVER;
  });
