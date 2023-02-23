import { id } from 'ethers';
import { z } from 'zod';

import { AddressSchema } from '../../../common/schema/address.schema';
import { SupportedChainId } from '../../../../config/constants';

/**
 * Checks the method selector of the call data to determine if it is an execTransaction call
 * @param data call data
 * @returns boolean
 */
const isExecTransactionCall = (data: string): boolean => {
  const EXEC_TX_SIGNATURE =
    'execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)';

  const execTxSignatureId = id(EXEC_TX_SIGNATURE).slice(0, 10);
  return data.startsWith(execTxSignatureId);
};

export const SponsoredCallSchema = z.object({
  chainId: z.nativeEnum(SupportedChainId),
  target: AddressSchema,
  data: z.string().refine(isExecTransactionCall),
  gasLimit: z.optional(z.string().regex(/^\d+$/)),
});
