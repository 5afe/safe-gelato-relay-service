import axios from 'axios';

import configuration from '../../config/configuration';

/**
 * Queries the gateway to determine if the given address is a Safe on the given chain
 * @param chainId chain ID
 * @param address address
 * @returns boolean
 */
export const isSafeContract = async (
  chainId: string,
  address: string,
): Promise<boolean> => {
  try {
    await axios.get(
      `${configuration().gatewayUrl}/v1/chains/${chainId}/safes/${address}`,
    );
    return true;
  } catch {
    return false;
  }
};
