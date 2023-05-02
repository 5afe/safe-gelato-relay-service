import { ethers } from 'ethers';
import { getMultiSendCallOnlyDeployment } from '@safe-global/safe-deployments';

import { Multi_send__factory } from '../../../../../contracts/safe/factories/v1.3.0';
import { isValidExecTransactionCall } from './execTransaction';

const multiSendInterface = Multi_send__factory.createInterface();

const multiSendFragment = multiSendInterface.getFunction('multiSend');

/**
 * Checks the method selector of the call data to determine if it is an `multiSend` call
 *
 * @param data call data
 * @returns boolean
 */
const isMultiSendCalldata = (data: string): boolean => {
  return data.startsWith(multiSendFragment.selector);
};

/**
 * Validates that the call `data` is `multiSend` and the `to` address is the MultiSendCallOnly deployment
 *
 * @param chainId chainId
 * @param to MultiSendCallOnly address
 * @param data `multiSend` call data
 * @returns whether the call is valid
 */
export const isValidMultiSendCall = (
  chainId: string,
  to: string,
  data: string,
) => {
  if (!isMultiSendCalldata(data)) {
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

interface MultiSendTransactionData {
  readonly to: string;
  readonly data: string;
}

/**
 * Decodes the transactions contained in `multiSend` call data
 *
 * @param encodedMultiSendData `multiSend` call data
 * @returns array of individual transaction data
 */
const decodeMultiSendTxs = (
  encodedMultiSendData: string,
): MultiSendTransactionData[] => {
  // uint8 operation, address to, uint256 value, uint256 dataLength
  const INDIVIDUAL_TX_DATA_LENGTH = 2 + 40 + 64 + 64;

  const [decodedMultiSendData] = multiSendInterface.decodeFunctionData(
    multiSendFragment,
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
 * Extracts the common `to` address from `multiSend` call data if it is not a self-transaction
 *
 * @param data multisend call data
 * @returns the `to` address of all batched transactions contained in `data` or `null` if the transactions do not share one common `to` address.
 */
export const getSafeAddressFromMultiSend = (data: string): string | null => {
  const individualTxs = decodeMultiSendTxs(data);

  if (individualTxs.length === 0) {
    return null;
  }

  const isEveryTxValidExecTx = individualTxs.every(({ to, data }) => {
    return isValidExecTransactionCall(to, data);
  });

  if (!isEveryTxValidExecTx) {
    return null;
  }

  const firstRecipient = individualTxs[0].to;

  const isSameToAddress = individualTxs.every(({ to }) => {
    return to === firstRecipient;
  });

  if (!isSameToAddress) {
    return null;
  }

  return ethers.getAddress(firstRecipient);
};
