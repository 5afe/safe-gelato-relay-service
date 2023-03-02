import {
  getMultiSendCallOnlyDeployment,
  getProxyFactoryDeployment,
} from '@safe-global/safe-deployments';
import {
  AbiCoder,
  ethers,
  getCreate2Address,
  Interface,
  keccak256,
} from 'ethers';

import { SupportedChainId } from '../../config/constants';

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

// ================= createProxyWithNonce ==================

export const isCreateProxyWithNonceCall = (data: string): boolean => {
  const CREATE_PROXY_WITH_NONCE_TX_SIGNATURE =
    'createProxyWithNonce(address,bytes,uint256)';

  return isCalldata(data, CREATE_PROXY_WITH_NONCE_TX_SIGNATURE);
};

interface CreateProxyWithNonceTransactionData {
  readonly singleton: string;
  readonly initializer: string;
  readonly saltNonce: bigint;
}

/**
 * Decodes the createProxyWith calldata
 * @param encodedData createProxyWithNonce calldata
 * @returns mastercopy singleton address, setup initializer data and salt nonce
 */
export const _decodeCreateProxyWithNonce = (
  encodedData: string,
): CreateProxyWithNonceTransactionData => {
  const CREATE_PROXY_WITH_NONCE_FRAGMENT =
    'function createProxyWithNonce(address _singleton, bytes memory initializer, uint256 saltNonce)';

  const createProxyWithNonceInterface = new Interface([
    CREATE_PROXY_WITH_NONCE_FRAGMENT,
  ]);

  const [singleton, initializer, saltNonce] =
    createProxyWithNonceInterface.decodeFunctionData(
      CREATE_PROXY_WITH_NONCE_FRAGMENT,
      encodedData,
    );

  return {
    singleton,
    initializer,
    saltNonce,
  };
};

/**
 * proxyCreationCode is hardcoded so that we don't have to query the blockchain for it
 * Whenever a new version is deployed or we support relaying on more networks this will
 * need to be updated or we revert to querying the blockchain for it.
 *
 * If we decide to query the blockchain, we should also consider using the core SDK instead.
 *
 * @see https://github.com/safe-global/safe-contracts/blob/main/contracts/proxies/SafeProxyFactory.sol#L15
 */
const PROXY_CREATION_CODE_VERSION = '1.3.0';
const PROXY_CREATION_CODE: { [key in SupportedChainId]: string } = {
  [SupportedChainId.GOERLI]:
    '0x608060405234801561001057600080fd5b506040516101e63803806101e68339818101604052602081101561003357600080fd5b8101908080519060200190929190505050600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614156100ca576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260228152602001806101c46022913960400191505060405180910390fd5b806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505060ab806101196000396000f3fe608060405273ffffffffffffffffffffffffffffffffffffffff600054167fa619486e0000000000000000000000000000000000000000000000000000000060003514156050578060005260206000f35b3660008037600080366000845af43d6000803e60008114156070573d6000fd5b3d6000f3fea2646970667358221220d1429297349653a4918076d650332de1a1068c5f3e07c5c82360c277770b955264736f6c63430007060033496e76616c69642073696e676c65746f6e20616464726573732070726f7669646564',
  [SupportedChainId.GNOSIS_CHAIN]:
    '0x608060405234801561001057600080fd5b506040516101e63803806101e68339818101604052602081101561003357600080fd5b8101908080519060200190929190505050600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614156100ca576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260228152602001806101c46022913960400191505060405180910390fd5b806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505060ab806101196000396000f3fe608060405273ffffffffffffffffffffffffffffffffffffffff600054167fa619486e0000000000000000000000000000000000000000000000000000000060003514156050578060005260206000f35b3660008037600080366000845af43d6000803e60008114156070573d6000fd5b3d6000f3fea2646970667358221220d1429297349653a4918076d650332de1a1068c5f3e07c5c82360c277770b955264736f6c63430007060033496e76616c69642073696e676c65746f6e20616464726573732070726f7669646564',
};

/**
 * Predicts the Safe address from createProxyWithNonce calldata
 * @param chainId chainId
 * @param to proxyFactory address
 * @param data createProxyWithNonce calldata
 * @returns Safe address
 */
export const predictSafeAddress = (
  chainId: string,
  to: string,
  data: string,
): string | undefined => {
  const proxyFactoryDeployment = getProxyFactoryDeployment({
    network: chainId,
    version: PROXY_CREATION_CODE_VERSION,
  });

  const isOfficialProxyFactory =
    proxyFactoryDeployment && to === proxyFactoryDeployment.defaultAddress;

  if (!isOfficialProxyFactory) {
    return;
  }

  const abiCoder = AbiCoder.defaultAbiCoder();

  const { saltNonce, initializer, singleton } =
    _decodeCreateProxyWithNonce(data);

  const encodedNonce = abiCoder.encode(['uint256'], [saltNonce]);
  const salt = keccak256(keccak256(initializer) + encodedNonce.slice(2));

  const constructorData = abiCoder.encode(['address'], [singleton]);
  const initCode = keccak256(
    PROXY_CREATION_CODE[chainId] + constructorData.slice(2),
  );

  return getCreate2Address(to, salt, initCode);
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
 * Validates that the call `data` is `multiSend` and the `to` address is the MultiSendCallOnly deployment.
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
