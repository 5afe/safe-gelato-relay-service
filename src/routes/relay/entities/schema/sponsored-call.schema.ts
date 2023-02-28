import { z } from 'zod';

import { AddressSchema } from '../../../common/schema/address.schema';
import { ChainIdSchema } from '../../../common/schema/chain-id.schema';
import {
  isValidMultiSendCall,
  isExecTransactionCall,
  isMultiSendCall,
  getSafeAddressFromMultiSend,
} from '../../../../routes/common/transactions.helper';
import { isSafeContract } from '../../../../routes/common/safe.helper';

export const SponsoredCallSchema = z
  .object({
    chainId: ChainIdSchema,
    to: AddressSchema,
    data: z.string(),
    gasLimit: z.optional(z.string().regex(/^\d+$/)),
  })
  .transform(async (values, ctx) => {
    const { chainId, to, data } = values;

    const path = ['data'];
    const code = z.ZodIssueCode.custom;

    if (isExecTransactionCall(data)) {
      const isSafe = await isSafeContract(chainId, to);

      // Non-Safe smart contract mimicing `execTransaction`
      if (!isSafe) {
        ctx.addIssue({
          message: 'Only `execTransaction` from Safes can be relayed.',
          path,
          code,
        });

        return z.NEVER;
      }

      return {
        ...values,
        safeAddress: to,
      };
    }

    if (isMultiSendCall(data)) {
      const isValid = await isValidMultiSendCall(chainId, to, data);

      // MultiSend not containing only `execTransaction` calls from the same Safe
      if (!isValid) {
        ctx.addIssue({
          message: 'Invalid `multiSend` transaction.',
          path,
          code,
        });

        return z.NEVER;
      }

      const safeAddress = await getSafeAddressFromMultiSend(chainId, data);

      if (!safeAddress) {
        ctx.addIssue({
          message: 'Cannot decode Safe address from `multiSend` transaction.',
          path,
          code,
        });

        return z.NEVER;
      }

      return {
        ...values,
        safeAddress,
      };
    }

    ctx.addIssue({
      message: 'Only (batched) Safe transactions can be relayed.',
      path,
      code,
    });

    return z.NEVER;
  });
