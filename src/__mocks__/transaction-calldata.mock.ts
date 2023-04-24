import { faker } from '@faker-js/faker';
import { ethers } from 'ethers';
import {
  getMultiSendCallOnlyDeployment,
  getProxyFactoryDeployment,
  getSafeSingletonDeployment,
} from '@safe-global/safe-deployments';
import type { DeploymentFilter } from '@safe-global/safe-deployments';

export const MOCK_UNSUPPORTED_CALLDATA = new ethers.Interface([
  'function unsupported()',
]).encodeFunctionData('unsupported');

function getSafeSingletonInterface(
  filter?: DeploymentFilter,
): ethers.Interface {
  const safeDeployment = getSafeSingletonDeployment(filter);

  if (!safeDeployment) {
    throw new Error('Safe deployment not found');
  }

  return new ethers.Interface(safeDeployment.abi);
}

function getPrevalidatedSignature(address: string): string {
  return `${ethers.zeroPadValue(
    address,
    32,
  )}000000000000000000000000000000000000000000000000000000000000000001`;
}

function encodeSafeFunctionData(
  ...args: Parameters<
    InstanceType<typeof ethers.Interface>['encodeFunctionData']
  >
): string {
  const safeInterface = getSafeSingletonInterface();
  return safeInterface.encodeFunctionData(...args);
}

export function getMockExecTransactionCalldata({
  to,
  value,
  data = '0x',
  operation = 0,
  safeTxGas = 0,
  baseGas = 0,
  gasPrice = 0,
  gasToken = faker.finance.ethereumAddress(),
  refundReceiver = faker.finance.ethereumAddress(),
  signatures = getPrevalidatedSignature(to),
}: {
  to: string;
  value: number;
  data?: string;
  operation?: 0 | 1;
  safeTxGas?: number;
  baseGas?: number;
  gasPrice?: number;
  gasToken?: string;
  refundReceiver?: string;
  signatures?: string;
}): string {
  return encodeSafeFunctionData('execTransaction', [
    to,
    value,
    data,
    operation,
    safeTxGas,
    baseGas,
    gasPrice,
    gasToken,
    refundReceiver,
    signatures,
  ]);
}

export function getMockAddOwnerWithThresholdCalldata() {
  return encodeSafeFunctionData('addOwnerWithThreshold', [
    faker.finance.ethereumAddress(),
    faker.datatype.number(),
  ]);
}

export function getMockChangeThresholdCalldata() {
  return encodeSafeFunctionData('changeThreshold', [faker.datatype.number()]);
}

export function getMockDisableModuleCalldata() {
  return encodeSafeFunctionData('disableModule', [
    faker.finance.ethereumAddress(),
    faker.finance.ethereumAddress(),
  ]);
}

export function getMockEnableModuleCalldata() {
  return encodeSafeFunctionData('enableModule', [
    faker.finance.ethereumAddress(),
  ]);
}

export function getMockRemoveOwnerCallData() {
  return encodeSafeFunctionData('removeOwner', [
    faker.finance.ethereumAddress(),
    faker.finance.ethereumAddress(),
    1,
  ]);
}

export function getMockSetFallbackHandlerCalldata() {
  return encodeSafeFunctionData('setFallbackHandler', [
    faker.finance.ethereumAddress(),
  ]);
}

export function getMockSetGuardCalldata() {
  return encodeSafeFunctionData('setGuard', [faker.finance.ethereumAddress()]);
}

export function getMockSwapOwnerCallData() {
  return encodeSafeFunctionData('swapOwner', [
    faker.finance.ethereumAddress(),
    faker.finance.ethereumAddress(),
    faker.finance.ethereumAddress(),
  ]);
}

function getMultiSendCallOnlyInterface(
  filter?: DeploymentFilter,
): ethers.Interface {
  const multiSendDeployment = getMultiSendCallOnlyDeployment(filter);

  if (!multiSendDeployment) {
    throw new Error('MultiSendCallOnly deployment not found');
  }

  return new ethers.Interface(multiSendDeployment.abi);
}

export function getMockMultiSendCalldata(
  transactions: Array<{
    to: string;
    value: number;
    data: string;
  }>,
): string {
  // MultiSendCallOnly
  const OPERATION = 0;

  const multiSendInterface = getMultiSendCallOnlyInterface();

  const internalTransactions = transactions.map(({ to, value, data }) => {
    return ethers.solidityPacked(
      ['uint8', 'address', 'uint256', 'uint256', 'bytes'],
      [OPERATION, to, value, ethers.dataLength(data), ethers.getBytes(data)],
    );
  });

  return multiSendInterface.encodeFunctionData('multiSend', [
    ethers.concat(internalTransactions),
  ]);
}

function getMockSetupCalldata({
  owners,
  threshold,
  to = faker.finance.ethereumAddress(),
  data = '0x',
  fallbackHandler = faker.finance.ethereumAddress(),
  paymentToken = faker.finance.ethereumAddress(),
  payment = 0,
  paymentReceiver = faker.finance.ethereumAddress(),
}: {
  owners: string[];
  threshold: number;
  to?: string;
  data?: string;
  fallbackHandler?: string;
  paymentToken?: string;
  payment?: number;
  paymentReceiver?: string;
}): string {
  return encodeSafeFunctionData('setup', [
    owners,
    threshold,
    to,
    data,
    fallbackHandler,
    paymentToken,
    payment,
    paymentReceiver,
  ]);
}

function getProxyFactoryInterface(filter?: DeploymentFilter): ethers.Interface {
  const deployment = getProxyFactoryDeployment(filter);

  if (!deployment) {
    throw new Error('SafeProxyFactory not found');
  }

  return new ethers.Interface(deployment.abi);
}

export function getMockCreateProxyWithNonceCalldata({
  owners,
  threshold,
  singleton,
  saltNonce = faker.datatype.number(),
}: {
  owners: string[];
  threshold: number;
  singleton: string;
  saltNonce?: number;
}): string {
  const proxyFactoryInterface = getProxyFactoryInterface();

  const initializer = getMockSetupCalldata({ owners, threshold });

  return proxyFactoryInterface.encodeFunctionData('createProxyWithNonce', [
    singleton,
    initializer,
    saltNonce,
  ]);
}

export function getMockErc20TransferCalldata({
  to,
  value,
}: {
  to: string;
  value: number;
}): string {
  const ERC20_TRANFER_FRAGMENT = 'function transfer(address,uint256)';

  return new ethers.Interface([ERC20_TRANFER_FRAGMENT]).encodeFunctionData(
    'transfer',
    [to, value],
  );
}
