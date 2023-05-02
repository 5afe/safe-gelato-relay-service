import { Gnosis_safe__factory } from '../../../../../contracts/safe/factories/v1.3.0';
import { isErc20TransferCalldata, getErc20TransferTo } from './erc20';
import { isSafeCalldata } from './safe';

const safeInterface = Gnosis_safe__factory.createInterface();

const execTransactionFragment = safeInterface.getFunction('execTransaction');

/**
 * Checks the method selector of the call data to determine if it is an `execTransaction` call
 *
 * @param data call data
 * @returns boolean
 */
const isExecTransactionCalldata = (data: string): boolean => {
  return data.startsWith(execTransactionFragment.selector);
};

/**
 * Validates that the call `data` is `execTransaction` and the `to` address is not self
 * other than Safe-specific ones such as owner management or setting the fallback handler
 *
 * @param to recipient address
 * @param data `execTransaction` call data
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

  // ERC-20 `transfer`
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
