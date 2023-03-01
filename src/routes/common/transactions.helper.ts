import { getMultiSendCallOnlyDeployment } from '@safe-global/safe-deployments';
import { ethers } from 'ethers';

import { isSafeContract } from './safe.helper';

// ======================== General ========================

/**
 * Checks the method selector of the call data to determine if it is the specified call
 * @param data call data
 * @returns boolean
 */
const isCalldata = (data: string, signature: string): boolean => {
  const signatureId = ethers.id(signature).slice(0, 10);

  return data.startsWith(signatureId);
};

// ==================== execTransaction ====================

/**
 * Checks the method selector of the call data to determine if it is an execTransaction call
 * @param data call data
 * @returns boolean
 */
export const isExecTransactionCall = (data: string): boolean => {
  const EXEC_TX_SIGNATURE =
    'execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)';

  return isCalldata(data, EXEC_TX_SIGNATURE);
};

// ======================= multiSend =======================

/**
 * Checks the method selector of the call data to determine if it is an multiSend call
 * @param data call data
 * @returns boolean
 */
export const isMultiSendCall = (data: string): boolean => {
  const MULTISEND_TX_SIGNATURE = 'multiSend(bytes)';

  return isCalldata(data, MULTISEND_TX_SIGNATURE);
};

interface MultiSendTransactionData {
  readonly to: string;
  readonly data: string;
}

/**
 * Decodes the transactions contained in a multiSend call
 * @param encodedMultiSendData multiSend call data
 * @returns array of individual transaction data
 */
export const decodeMultiSendTxs = (
  encodedMultiSendData: string,
): MultiSendTransactionData[] => {
  // uint8 operation, address to, uint256 value, uint256 dataLength
  const INDIVIDUAL_TX_DATA_LENGTH = 2 + 40 + 64 + 64;

  const MULTISEND_FRAGMENT =
    'function multiSend(bytes memory transactions) public payable';

  const multiSendInterface = new ethers.Interface([MULTISEND_FRAGMENT]);

  const [decodedMultiSendData] = multiSendInterface.decodeFunctionData(
    MULTISEND_FRAGMENT,
    encodedMultiSendData,
  );

  const txs: MultiSendTransactionData[] = [];

  // Decode after 0x
  let index = 2;

  while (index < decodedMultiSendData.length) {
    const txDataEncoded = `0x${decodedMultiSendData.slice(
      index,
      // Traverse next transaction
      (index += INDIVIDUAL_TX_DATA_LENGTH),
    )}`;

    // Decode operation, to, value, dataLength
    const [, txTo, , txDataBytesLength] =
      ethers.AbiCoder.defaultAbiCoder().decode(
        ['uint8', 'address', 'uint256', 'uint256'],
        ethers.zeroPadValue(txDataEncoded, 32 * 4),
      );

    // Each byte is represented by two characters
    const dataLength = Number(txDataBytesLength) * 2;

    const txData = `0x${decodedMultiSendData.slice(
      index,
      // Traverse data length
      (index += dataLength),
    )}`;

    txs.push({
      to: txTo,
      data: txData,
    });
  }

  return txs;
};

/**
 * Extracts the common `to` address from a multisend transaction
 *
 * @param data multisend call data
 * @returns the `to` address of all batched transactions contained in `data` or `undefined` if the transactions do not share one common `to` address.
 */
export const getSafeAddressFromMultiSend = async (
  chainId: string,
  data: string,
): Promise<string | void> => {
  const individualTxs = decodeMultiSendTxs(data);

  if (individualTxs.length === 0) {
    return;
  }

  const isEveryTxExecTx = individualTxs.every(({ data }) => {
    return isExecTransactionCall(data);
  });

  if (!isEveryTxExecTx) {
    return;
  }

  const firstRecipient = individualTxs[0].to;

  const isSameToAddress = individualTxs.every(({ to }) => {
    return to === firstRecipient;
  });

  if (!isSameToAddress) {
    return;
  }

  if (!(await isSafeContract(chainId, firstRecipient))) {
    return;
  }

  return firstRecipient;
};

/**
 * Validates if a multiSend call is valid for a given Safe address:
 *
 * @param chainId chainId
 * @param to multiSend address
 * @param data multiSend call data
 * @returns whether the call is valid
 */
export const isValidMultiSendCall = async (
  chainId: string,
  to: string,
  data: string,
) => {
  if (!isMultiSendCall(data)) {
    return false;
  }

  const multiSendLib = getMultiSendCallOnlyDeployment({
    network: chainId,
  });

  if (!multiSendLib || multiSendLib.defaultAddress !== to) {
    return false;
  }

  return true;
};
