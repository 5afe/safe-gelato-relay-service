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
 * @param data multiSend call data
 * @returns array of individual transaction data
 */
export const decodeMultiSendTxs = (
  data: string,
): MultiSendTransactionData[] => {
  const OPERATION_LENGTH = 2;
  const ADDRESS_LENGTH = 40;
  const UINT256_LENGTH = 64;

  const INDIVIDUAL_TX_DATA_LENGTH =
    OPERATION_LENGTH + // operation
    ADDRESS_LENGTH + // to
    UINT256_LENGTH + // value
    UINT256_LENGTH; // dataLength

  const MULTISEND_FRAGMENT =
    'function multiSend(bytes memory transactions) public payable';

  const multiSendInterface = new ethers.Interface([MULTISEND_FRAGMENT]);

  const txs: MultiSendTransactionData[] = [];

  // Decode multiSend and remove '0x'
  let remainingData: string = multiSendInterface
    .decodeFunctionData('multiSend', data)[0]
    .slice(2);

  while (remainingData.length > 0) {
    const txDataEncoded = ethers.zeroPadValue(
      // We remove the operation as MultiSendCallOnly only allows call operation
      // @see https://github.com/safe-global/safe-contracts/blob/main/contracts/libraries/MultiSendCallOnly.sol#L51
      `0x${remainingData.slice(OPERATION_LENGTH, INDIVIDUAL_TX_DATA_LENGTH)}`,
      32 * 3,
    );

    // Decode constant length data of next transaction
    const [txTo, , txDataByteLength] = ethers.AbiCoder.defaultAbiCoder().decode(
      ['address', 'uint256', 'uint256'],
      txDataEncoded,
    );

    // Progress to dynamic length inner transaction `data`
    remainingData = remainingData.slice(INDIVIDUAL_TX_DATA_LENGTH);

    // Each byte is represented by two characters
    const dataLength = Number(BigInt(txDataByteLength) * BigInt(2));

    const txData = `0x${remainingData.slice(0, dataLength)}`;

    // Progress to next transaction
    remainingData = remainingData.slice(dataLength);

    txs.push({
      to: txTo.toString(),
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
