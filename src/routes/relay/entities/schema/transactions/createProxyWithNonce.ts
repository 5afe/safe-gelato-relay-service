import { ethers } from 'ethers';
import {
  getProxyFactoryDeployment,
  getSafeL2SingletonDeployment,
  getSafeSingletonDeployment,
} from '@safe-global/safe-deployments';

import {
  Gnosis_safe__factory,
  Proxy_factory__factory,
} from '../../../../../contracts/safe/factories/v1.3.0';

const proxyFactoryInterface = Proxy_factory__factory.createInterface();

const createProxyWithNonceFragment = proxyFactoryInterface.getFunction(
  'createProxyWithNonce',
);

/**
 * Checks the method selector of the call data to determine if it is a `createProxyWithNonce` call
 *
 * @param data call data
 * @returns boolean
 */
export const isCreateProxyWithNonceCalldata = (data: string): boolean => {
  return data.startsWith(createProxyWithNonceFragment.selector);
};

interface CreateProxyWithNonceTransactionData {
  readonly singleton: string;
  readonly initializer: string;
  readonly saltNonce: bigint;
}

/**
 * Decodes the parameters of a `createProxyWithNonce` call
 *
 * @param data call data
 * @returns the decoded parameters
 */
const decodeCreateProxyWithNonce = (
  data: string,
): CreateProxyWithNonceTransactionData => {
  const [singleton, initializer, saltNonce] =
    proxyFactoryInterface.decodeFunctionData(
      createProxyWithNonceFragment,
      data,
    );

  return {
    singleton,
    initializer,
    saltNonce,
  };
};

/**
 * Validates that the call `data` is `createProxyWithNonce` and the `to` address is the ProxyFactory deployment
 *
 * @param chainId chainId
 * @param to ProxyFactory address
 * @param data `createProxyWithNonce` call data
 * @returns whether the call is valid
 */
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

  const [singleton] = proxyFactoryInterface.decodeFunctionData(
    createProxyWithNonceFragment,
    data,
  );

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

/**
 * Extracts the owners of a to-be-created Safe from `createProxyWithNonce` call data
 *
 * @param data `createProxyWithNonce` call data
 * @returns the owners of the to-be-created Safe
 */
export const getOwnersFromCreateProxyWithNonce = (
  encodedData: string,
): string[] => {
  const { initializer } = decodeCreateProxyWithNonce(encodedData);

  const safeInterface = Gnosis_safe__factory.createInterface();

  const setupFragment = safeInterface.getFunction('setup');
  const [owners] = safeInterface.decodeFunctionData(setupFragment, initializer);

  return owners.map(ethers.getAddress);
};
