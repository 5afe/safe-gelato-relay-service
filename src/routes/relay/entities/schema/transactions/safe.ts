import { ethers } from 'ethers';
import {
  SingletonDeployment,
  getSafeL2SingletonDeployment,
  getSafeSingletonDeployment,
} from '@safe-global/safe-deployments';

/**
 * Checks whether data is a call to any method in the specified singleton
 *
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
      return data.startsWith(fragment.selector);
    }
  });
};

/**
 * Checks whether data is a call to any method in the Safe singleton
 *
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
