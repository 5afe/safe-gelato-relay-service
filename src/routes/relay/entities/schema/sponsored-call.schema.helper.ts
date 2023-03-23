import {
  getMultiSendCallOnlyDeployment,
  getProxyFactoryDeployment,
} from '@safe-global/safe-deployments';
import { ethers, Interface } from 'ethers';

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
const isMultiSendCall = (data: string): boolean => {
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
// TODO: Replace with https://github.com/safe-global/safe-core-sdk/pull/342 when merged
const decodeMultiSendTxs = (
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
export const getSafeAddressFromMultiSend = (data: string): string | null => {
  const individualTxs = decodeMultiSendTxs(data);

  if (individualTxs.length === 0) {
    return null;
  }

  const isEveryTxExecTx = individualTxs.every(({ data }) => {
    return isExecTransactionCall(data);
  });

  if (!isEveryTxExecTx) {
    return null;
  }

  const firstRecipient = individualTxs[0].to;

  const isSameToAddress = individualTxs.every(({ to }) => {
    return to === firstRecipient;
  });

  if (!isSameToAddress) {
    return null;
  }

  return firstRecipient;
};

/**
 * Validates that the call `data` is `multiSend` and the `to` address is the MultiSendCallOnly deployment.
 *
 * @param chainId chainId
 * @param to multiSend address
 * @param data multiSend call data
 * @returns whether the call is valid
 */
export const isValidMultiSendCall = (
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

// ============================= setup =============================

export const isSetupCall = (data: string): boolean => {
  const SETUP_TX_SIGNATURE =
    'setup(address[],uint256,address,bytes,address,address,uint256,address)';

  return isCalldata(data, SETUP_TX_SIGNATURE);
};

export const isValidSetupCall = (
  chainId: string,
  to: string,
  data: string,
): boolean => {
  if (!isSetupCall(data)) {
    return false;
  }

  const proxyFactoryDeployment = getProxyFactoryDeployment({
    network: chainId,
  });

  if (!proxyFactoryDeployment || to !== proxyFactoryDeployment.defaultAddress) {
    return false;
  }

  return true;
};

export const getOwnersFromSetup = (encodedData: string): string[] => {
  const SETUP_FRAGMENT =
    'function setup(address[] calldata _owners, uint256 _threshold, address to, bytes calldata data, address fallbackHandler, address paymentToken, uint256 payment, address payable paymentReceiver) external';

  const setupInterface = new Interface([SETUP_FRAGMENT]);

  const [owners] = setupInterface.decodeFunctionData(
    SETUP_FRAGMENT,
    encodedData,
  );

  return owners;
};
