import { ethers } from 'ethers';
import {
  getMultiSendCallOnlyDeployment,
  getProxyFactoryDeployment,
  getSafeL2SingletonDeployment,
  getSafeSingletonDeployment,
} from '@safe-global/safe-deployments';
import type { SingletonDeployment } from '@safe-global/safe-deployments';

import { ERC20__factory } from '../../../../../contracts/openzeppelin';
import {
  Gnosis_safe__factory,
  Multi_send__factory,
  Proxy_factory__factory,
} from '../../../../../contracts/safe/factories/v1.3.0';

// ======================== General ========================

/**
 * Checks the method selector of the call data to determine if it is the specified call
 * @param data call data
 * @param fragment function fragment
 * @returns boolean
 */
const isCalldata = (
  data: string,
  fragment: ethers.FunctionFragment,
): boolean => {
  return data.startsWith(fragment.selector);
};

// ======================== ERC-20 =========================

const erc20Interface = ERC20__factory.createInterface();

const transferFragment = erc20Interface.getFunction('transfer');

/**
 * Checks the method selector of the call data to determine if it is a transfer call
 * @param data call data
 * @returns boolean
 */
const isErc20TransferCalldata = (data: string): boolean => {
  return isCalldata(data, transferFragment);
};

/**
 * Extracts the `to` address from an ERC-20 transfer call
 *
 * @param data transfer call data
 * @returns the `to` address of an ERC-20 transfer
 */
const getErc20TransferTo = (data: string): string => {
  const [to] = erc20Interface.decodeFunctionData(transferFragment, data);

  return to;
};

// ========================= Safe ==========================

const safeInterface = Gnosis_safe__factory.createInterface();

const execTransactionFragment = safeInterface.getFunction('execTransaction');

/**
 * Checks whether data is a call to any method in the specified singleton
 * @param singletonDeployment singleton deployment
 * @param data call data
 * @returns boolean
 */
const isSingletonCalldata = (
  singletonDeployment: SingletonDeployment,
  data: string,
): boolean => {
  // Prefer official ABI over TypeChain
  const deploymentInterface = new ethers.Interface(singletonDeployment.abi);

  return deploymentInterface.fragments.some((fragment) => {
    if (ethers.FunctionFragment.isFunction(fragment)) {
      return isCalldata(data, fragment);
    }
  });
};

/**
 * Checks whether data is a call to any method in the Safe singleton
 * @param data call data
 * @returns boolean
 */
export const isSafeCalldata = (data: string): boolean => {
  const safeL1Deployment = getSafeSingletonDeployment();
  const safeL2Deployment = getSafeL2SingletonDeployment();

  if (!safeL1Deployment || !safeL2Deployment) {
    return false;
  }

  return (
    isSingletonCalldata(safeL1Deployment, data) ||
    isSingletonCalldata(safeL2Deployment, data)
  );
};

// ==================== execTransaction ====================

/**
 * Checks the method selector of the call data to determine if it is an execTransaction call
 * @param data call data
 * @returns boolean
 */
const isExecTransactionCalldata = (data: string): boolean => {
  return isCalldata(data, execTransactionFragment);
};

/**
 * Validates that the call `data` is `execTransaction` and the `to` address is not self
 * other than Safe-specific ones such as owner management or setting the fallback handler
 *
 * @param to recipient address
 * @param data execTransaction call data
 * @returns whether the call is valid
 */
export const isValidExecTransactionCall = (
  to: string,
  data: string,
): boolean => {
  if (!isExecTransactionCalldata(data)) {
    return false;
  }

  const [txTo, txValue, txData] = safeInterface.decodeFunctionData(
    execTransactionFragment,
    data,
  );

  // ERC-20 transfer
  if (isErc20TransferCalldata(txData)) {
    const recipient = getErc20TransferTo(txData);
    return recipient !== to;
  }

  // Transaction to another party
  const toSelf = to === txTo;
  if (!toSelf) {
    return true;
  }

  // `execTransaction` to self
  const hasValue = Number(txValue) > 0;
  if (hasValue) {
    return false;
  }

  // Safe-specific transaction, e.g. `setFallbackHandler`
  const isCancellation = txData === '0x';
  return isCancellation || isSafeCalldata(txData);
};

// ======================= multiSend =======================

const multiSendInterface = Multi_send__factory.createInterface();

const multiSendFragment = multiSendInterface.getFunction('multiSend');

/**
 * Checks the method selector of the call data to determine if it is an multiSend call
 * @param data call data
 * @returns boolean
 */
const isMultiSendCalldata = (data: string): boolean => {
  return isCalldata(data, multiSendFragment);
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
 * Extracts the common `to` address from a multisend transaction if it is not a self-transaction
 *
 * @param data multisend call data
 * @returns the `to` address of all batched transactions contained in `data` or `undefined` if the transactions do not share one common `to` address.
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

// ===================== createProxyWithNonce ======================

const proxyFactoryInterface = Proxy_factory__factory.createInterface();

const createProxyWithNonceFragment = proxyFactoryInterface.getFunction(
  'createProxyWithNonce',
);

export const isCreateProxyWithNonceCalldata = (data: string): boolean => {
  return isCalldata(data, createProxyWithNonceFragment);
};

interface CreateProxyWithNonceTransactionData {
  readonly singleton: string;
  readonly initializer: string;
  readonly saltNonce: bigint;
}

const decodeCreateProxyWithNonce = (
  encodedData: string,
): CreateProxyWithNonceTransactionData => {
  const [singleton, initializer, saltNonce] =
    proxyFactoryInterface.decodeFunctionData(
      createProxyWithNonceFragment,
      encodedData,
    );

  return {
    singleton,
    initializer,
    saltNonce,
  };
};

export const isValidCreateProxyWithNonceCall = (
  chainId: string,
  to: string,
  data: string,
): boolean => {
  if (!isCreateProxyWithNonceCalldata(data)) {
    return false;
  }

  const proxyFactoryDeployment = getProxyFactoryDeployment({
    network: chainId,
  });

  if (!proxyFactoryDeployment || to !== proxyFactoryDeployment.defaultAddress) {
    return false;
  }

  const { singleton } = decodeCreateProxyWithNonce(data);

  const safeL1Deployment = getSafeSingletonDeployment({
    network: chainId,
  });
  const safeL2Deployment = getSafeL2SingletonDeployment({
    network: chainId,
  });

  const isL1Singleton = safeL1Deployment?.defaultAddress === singleton;
  const isL2Singleton = safeL2Deployment?.defaultAddress === singleton;

  return isL1Singleton || isL2Singleton;
};

export const getOwnersFromCreateProxyWithNonce = (
  encodedData: string,
): string[] => {
  const { initializer } = decodeCreateProxyWithNonce(encodedData);

  const setupFragment = safeInterface.getFunction('setup');
  const [owners] = safeInterface.decodeFunctionData(setupFragment, initializer);

  return owners.map(ethers.getAddress);
};
