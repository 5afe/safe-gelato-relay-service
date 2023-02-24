import { id } from 'ethers';
import { z } from 'zod';
import axios from 'axios';

import { AddressSchema } from '../../../common/schema/address.schema';
import { ChainIdSchema } from '../../../common/schema/chain-id.schema';
import configuration from '../../../../config/configuration';

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

/**
 * Queries the gateway to determine if the given address is a Safe on the given chain
 * @param chainId chain ID
 * @param address address
 * @returns boolean
 */
const isSafe = async (chainId: string, address: string): Promise<boolean> => {
  try {
    await axios.get(
      `${configuration().gatewayUrl}/v1/chains/${chainId}/safes/${address}`,
    );
    return true;
  } catch {
    return false;
  }
};

export const SponsoredCallSchema = z
  .object({
    chainId: ChainIdSchema,
    to: AddressSchema,
    data: z.string().refine(isExecTransactionCall),
    gasLimit: z.optional(z.string().regex(/^\d+$/)),
  })
  .refine(({ chainId, to }) => isSafe(chainId, to), {
    path: ['to'],
  });
