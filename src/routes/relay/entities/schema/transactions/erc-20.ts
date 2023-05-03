import { ERC20__factory } from '../../../../../contracts/openzeppelin';

const erc20Interface = ERC20__factory.createInterface();

const transferFragment = erc20Interface.getFunction('transfer');

/**
 * Checks the method selector of the call data to determine if it is a `transfer` call
 *
 * @param data call data
 * @returns boolean
 */
export const isErc20TransferCalldata = (data: string): boolean => {
  return data.startsWith(transferFragment.selector);
};

/**
 * Extracts the `to` address from an ERC-20 `transfer` call
 *
 * @param data `transfer` call data
 * @returns the `to` address of an ERC-20 `transfer`
 */
export const getErc20TransferTo = (data: string): string => {
  const [to] = erc20Interface.decodeFunctionData(transferFragment, data);

  return to;
};
