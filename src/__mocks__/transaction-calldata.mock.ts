import { faker } from '@faker-js/faker';
import { ethers } from 'ethers';

import {
  Gnosis_safe__factory,
  Multi_send__factory,
  Proxy_factory__factory,
} from '../../contracts/safe/factories/v1.3.0';
import { ERC20__factory } from '../../contracts/openzeppelin';

export const MOCK_UNSUPPORTED_CALLDATA = new ethers.Interface([
  'function unsupported()',
]).encodeFunctionData('unsupported');

function getPrevalidatedSignature(address: string): string {
  return `${ethers.zeroPadValue(
    address,
    32,
  )}000000000000000000000000000000000000000000000000000000000000000001`;
}

const safeInterface = Gnosis_safe__factory.createInterface();

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

export function getMockAddOwnerWithThresholdCalldata() {
  return safeInterface.encodeFunctionData('addOwnerWithThreshold', [
    faker.finance.ethereumAddress(),
    faker.datatype.number(),
  ]);
}

export function getMockChangeThresholdCalldata() {
  return safeInterface.encodeFunctionData('changeThreshold', [
    faker.datatype.number(),
  ]);
}

export function getMockDisableModuleCalldata() {
  return safeInterface.encodeFunctionData('disableModule', [
    faker.finance.ethereumAddress(),
    faker.finance.ethereumAddress(),
  ]);
}

export function getMockEnableModuleCalldata() {
  return safeInterface.encodeFunctionData('enableModule', [
    faker.finance.ethereumAddress(),
  ]);
}

export function getMockRemoveOwnerCallData() {
  return safeInterface.encodeFunctionData('removeOwner', [
    faker.finance.ethereumAddress(),
    faker.finance.ethereumAddress(),
    1,
  ]);
}

export function getMockSetFallbackHandlerCalldata() {
  return safeInterface.encodeFunctionData('setFallbackHandler', [
    faker.finance.ethereumAddress(),
  ]);
}

export function getMockSetGuardCalldata() {
  return safeInterface.encodeFunctionData('setGuard', [
    faker.finance.ethereumAddress(),
  ]);
}

export function getMockSwapOwnerCallData() {
  return safeInterface.encodeFunctionData('swapOwner', [
    faker.finance.ethereumAddress(),
    faker.finance.ethereumAddress(),
    faker.finance.ethereumAddress(),
  ]);
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

  const internalTransactions = transactions.map(({ to, value, data }) => {
    return ethers.solidityPacked(
      ['uint8', 'address', 'uint256', 'uint256', 'bytes'],
      [OPERATION, to, value, ethers.dataLength(data), ethers.getBytes(data)],
    );
  });

  const multiSendInterface = Multi_send__factory.createInterface();
  return multiSendInterface.encodeFunctionData('multiSend', [
    ethers.concat(internalTransactions),
  ]);
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
  const initializer = getMockSetupCalldata({ owners, threshold });

  const proxyFactoryInterface = Proxy_factory__factory.createInterface();
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
  const erc20Interface = ERC20__factory.createInterface();
  return erc20Interface.encodeFunctionData('transfer', [to, value]);
}
