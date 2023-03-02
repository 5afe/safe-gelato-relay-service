import { z } from 'zod';

import { AddressSchema } from '../../../common/schema/address.schema';
import { ChainIdSchema } from '../../../common/schema/chain-id.schema';
import {
  isValidMultiSendCall,
  isExecTransactionCall,
  isMultiSendCall,
  getSafeAddressFromMultiSend,
  predictSafeAddress,
  isCreateProxyWithNonceCall,
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

    const setError = (message: string) => {
      ctx.addIssue({
        message,
        path: ['data'],
        code: z.ZodIssueCode.custom,
      });
    };

    if (isExecTransactionCall(data)) {
      const isSafe = await isSafeContract(chainId, to);

      // Non-Safe smart contract mimicing `execTransaction`
      if (!isSafe) {
        setError('Only `execTransaction` from Safes can be relayed.');

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
        setError('Invalid `multiSend` transaction.');

        return z.NEVER;
      }

      const safeAddress = await getSafeAddressFromMultiSend(chainId, data);

      if (!safeAddress) {
        setError('Cannot decode Safe address from `multiSend` transaction.');

        return z.NEVER;
      }

      return {
        ...values,
        safeAddress,
      };
    }

    if (isCreateProxyWithNonceCall(data)) {
      const predictedSafeAddress = predictSafeAddress(chainId, to, data);

      if (!predictedSafeAddress) {
        setError(
          'Cannot predict Safe address from `createProxyWithNonce` transaction.',
        );

        return z.NEVER;
      }

      return {
        ...values,
        safeAddress: predictedSafeAddress,
      };
    }

    setError('Invalid transaction data.');

    return z.NEVER;
  });
