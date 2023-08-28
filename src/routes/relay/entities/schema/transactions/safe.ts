import { ethers } from 'ethers';
import {
  getSafeL2SingletonDeployment,
  getSafeSingletonDeployment,
  SingletonDeployment,
} from '@safe-global/safe-deployments';
import { SUPPORTED_SAFE_VERSION } from '../../../constants';

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
  const safeL1Deployment = getSafeSingletonDeployment({
    version: SUPPORTED_SAFE_VERSION,
  });
  const safeL2Deployment = getSafeL2SingletonDeployment({
    version: SUPPORTED_SAFE_VERSION,
  });

  if (!safeL1Deployment || !safeL2Deployment) {
    return false;
  }

  return (
    isSingletonCalldata(safeL1Deployment, data) ||
    isSingletonCalldata(safeL2Deployment, data)
  );
};
