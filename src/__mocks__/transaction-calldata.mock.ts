import { faker } from '@faker-js/faker';
import { ethers } from 'ethers';
import {
  getMultiSendCallOnlyDeployment,
  getProxyFactoryDeployment,
  getSafeSingletonDeployment,
} from '@safe-global/safe-deployments';
import type { DeploymentFilter } from '@safe-global/safe-deployments';

export const MOCK_UNKNOWN_CALL_DATA = ethers.zeroPadBytes('0x7a761202', 970);

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
  return `0x000000000000000000000000${address.slice(
    2,
  )}000000000000000000000000000000000000000000000000000000000000000001`;
}

export async function getMockExecTransactionCalldata({
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
}): Promise<string> {
  const safeInterface = getSafeSingletonInterface();

  return safeInterface.encodeFunctionData('execTransaction', [
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

function getMultiSendCallOnlyInterface(
  filter?: DeploymentFilter,
): ethers.Interface {
  const multiSendDeployment = getMultiSendCallOnlyDeployment(filter);

  if (!multiSendDeployment) {
    throw new Error('MultiSendCallOnly deployment not found');
  }

  return new ethers.Interface(multiSendDeployment.abi);
}

export async function getMockMultiSendCalldata(
  transactions: Array<{
    to: string;
    value: number;
    data: string;
  }>,
): Promise<string> {
  // MultiSendCallOnly
  const OPERATION = 0;

  const multiSendInterface = getMultiSendCallOnlyInterface();

  const abiCoder = ethers.AbiCoder.defaultAbiCoder();

  const internalTransactions = transactions.map(({ to, value, data }) => {
    console.log('encode', [
      OPERATION,
      to,
      value,
      ethers.dataLength(data),
      data,
    ]);
    return abiCoder.encode(
      ['uint8', 'address', 'uint256', 'uint256', 'bytes'],
      [OPERATION, to, value, ethers.dataLength(data), data],
    );
  });

  return multiSendInterface.encodeFunctionData('multiSend', [
    ethers.concat(internalTransactions),
  ]);
}

async function getMockSetupCalldata({
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
}): Promise<string> {
  const safeInterface = getSafeSingletonInterface();

  return safeInterface.encodeFunctionData('setup', [
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

export async function getMockCreateProxyWithNonceCalldata({
  owners,
  threshold,
  singleton,
  saltNonce = faker.datatype.number(),
}: {
  owners: string[];
  threshold: number;
  singleton: string;
  saltNonce?: number;
}): Promise<string> {
  const proxyFactoryInterface = getProxyFactoryInterface();

  const initializer = await getMockSetupCalldata({ owners, threshold });

  return proxyFactoryInterface.encodeFunctionData('createProxyWithNonce', [
    singleton,
    initializer,
    saltNonce,
  ]);
}
