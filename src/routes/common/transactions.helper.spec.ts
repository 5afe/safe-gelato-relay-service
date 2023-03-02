import { faker } from '@faker-js/faker';
import * as axios from 'axios';
import * as deployments from '@safe-global/safe-deployments';
import type { SingletonDeployment } from '@safe-global/safe-deployments/dist/types';

import * as txHelpers from './transactions.helper';
import * as safeHelpers from './safe.helper';
import {
  MOCK_CREATE_PROXY_WITH_NONCE_TX_CALL_DATA,
  MOCK_EXEC_TX_CALL_DATA,
  MOCK_MULTISEND_TX_CALL_DATA,
} from '../../mocks/transaction-data.mock';

jest.mock('@safe-global/safe-deployments', () => {
  return {
    __esModule: true,
    ...jest.requireActual('@safe-global/safe-deployments'),
  };
});

describe('Transaction helpers', () => {
  describe('createProxyWithNonce', () => {
    describe('isCreateProxyWithNonceCall', () => {
      it('should return true if the data starts with the method selector', () => {
        const result = txHelpers.isCreateProxyWithNonceCall(
          MOCK_CREATE_PROXY_WITH_NONCE_TX_CALL_DATA,
        );
        expect(result).toBe(true);
      });
      it('should return false if the data is not that of createProxyWithNonce', () => {
        const result = txHelpers.isCreateProxyWithNonceCall(
          MOCK_EXEC_TX_CALL_DATA,
        );
        expect(result).toBe(false);
      });
    });

    describe('decodeCreateProxyWithNonce', () => {
      it('should return the decoded data', () => {
        const result = txHelpers._decodeCreateProxyWithNonce(
          MOCK_CREATE_PROXY_WITH_NONCE_TX_CALL_DATA,
        );

        expect(result).toStrictEqual({
          singleton: '0x3E5c63644E683549055b9Be8653de26E0B4CD36E',
          initializer:
            '0xb63e800d0000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000140000000000000000000000000f48f2b2d2a534e402487b3ee7c18c33aec0fe5e40000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000bbeedb6d8e56e23f5812e59d1b6602f15957271f0000000000000000000000000000000000000000000000000000000000000000',
          saltNonce: BigInt(4),
        });
      });
    });

    describe('predictSafeAddress', () => {
      const chainId = '5';
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const proxyFactoryAddress = deployments.getProxyFactoryDeployment({
        network: chainId,
        version: '1.3.0',
      })!.defaultAddress;

      let getProxyFactoryDeploymentSpy: jest.SpyInstance;

      beforeEach(() => {
        jest.clearAllMocks();

        getProxyFactoryDeploymentSpy = jest.spyOn(
          deployments,
          'getProxyFactoryDeployment',
        );
      });

      it('should predict the Safe address from the data', () => {
        const result = txHelpers.predictSafeAddress(
          '5',
          proxyFactoryAddress,
          MOCK_CREATE_PROXY_WITH_NONCE_TX_CALL_DATA,
        );

        expect(result).toBe('0x8E1a7c91EF7CfE9356f2c654286e00E9ECBf5C3B');

        expect(getProxyFactoryDeploymentSpy).toHaveBeenCalledTimes(1);
      });

      it('should return undefined if no deployment exists for the given chainId', () => {
        const result = txHelpers.predictSafeAddress(
          'fakeChainId',
          faker.finance.ethereumAddress(),
          MOCK_CREATE_PROXY_WITH_NONCE_TX_CALL_DATA,
        );

        expect(result).toBeUndefined();

        expect(getProxyFactoryDeploymentSpy).toHaveBeenCalledTimes(1);
      });

      it('should return undefined if the to address is not an official proxyFactory', () => {
        const result = txHelpers.predictSafeAddress(
          '5',
          faker.finance.ethereumAddress(),
          MOCK_CREATE_PROXY_WITH_NONCE_TX_CALL_DATA,
        );

        expect(result).toBeUndefined();

        expect(getProxyFactoryDeploymentSpy).toHaveBeenCalledTimes(1);
      });
    });
  });
  describe('execTransaction', () => {
    describe('isExecTransactionCall', () => {
      it('should return true if the call data starts with the method selector', () => {
        const result = txHelpers.isExecTransactionCall(MOCK_EXEC_TX_CALL_DATA);
        expect(result).toBe(true);
      });

      it('should return false if the call data is not that of execTransaction', () => {
        const result = txHelpers.isExecTransactionCall(
          MOCK_MULTISEND_TX_CALL_DATA,
        );
        expect(result).toBe(false);
      });
    });
  });

  describe('multiSend', () => {
    describe('isMultiSendCall', () => {
      it('should return true if the call data starts with the method selector', () => {
        const result = txHelpers.isMultiSendCall(MOCK_MULTISEND_TX_CALL_DATA);
        expect(result).toBe(true);
      });

      it('should return false if the call data is not that of multiSend', () => {
        const result = txHelpers.isMultiSendCall(MOCK_EXEC_TX_CALL_DATA);
        expect(result).toBe(false);
      });
    });

    describe('decodeMultiSendTxs', () => {
      it('should return a decoded list of transactions', () => {
        const result = txHelpers.decodeMultiSendTxs(
          MOCK_MULTISEND_TX_CALL_DATA,
        );

        expect(result).toStrictEqual([
          {
            data: '0x6a761202000000000000000000000000ccb0f4cf5d3f97f4a55bb5f5ca321c3ed033f2440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001a0000000000000000000000000000000000000000000000000000000000000002467a5cd060000000000000000000000008c9e6c40d3402480ace624730524facc5482798c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004100f27c99f2baa600bcba90a6262494eb7da9acaf7586fded4b06962e2575307d367cd7cfddaf544979c26012957cbe2e06d465451b6e75eca3f1a8b6101bf7a21c00000000000000000000000000000000000000000000000000000000000000',
            to: '0xAecDFD3A19f777F0c03e6bf99AAfB59937d6467b',
          },
          {
            data: '0x6a761202000000000000000000000000ccb0f4cf5d3f97f4a55bb5f5ca321c3ed033f2440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001a0000000000000000000000000000000000000000000000000000000000000002467a5cd060000000000000000000000001f1f156e0317167c11aa412e3d1435ea29dc3cce0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000414417cc71e8425794ddc5407698c00687550f96b72611d29be3e3932961a773a93a39207cf270e858df5f93bc73f00fab83d5ff0fc7e63d8ba1f594181b8b710c1b00000000000000000000000000000000000000000000000000000000000000',
            to: '0xAecDFD3A19f777F0c03e6bf99AAfB59937d6467b',
          },
          {
            data: '0x6a761202000000000000000000000000ccb0f4cf5d3f97f4a55bb5f5ca321c3ed033f2440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001a0000000000000000000000000000000000000000000000000000000000000002467a5cd06000000000000000000000000e0c9275e44ea80ef17579d33c55136b7da269aeb0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000413025d6998e7119a300fe01691272270f28c6964df4fffd571bf36cc0468f75072d464a1879f49e6e0c4e44b11329dbbd43d539775a7eac968aafba4351a1652b1b00000000000000000000000000000000000000000000000000000000000000',
            to: '0xAecDFD3A19f777F0c03e6bf99AAfB59937d6467b',
          },
          {
            data: '0x6a761202000000000000000000000000ccb0f4cf5d3f97f4a55bb5f5ca321c3ed033f2440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001a0000000000000000000000000000000000000000000000000000000000000002467a5cd06000000000000000000000000dfcea9088c8a88a76ff74892c1457c17dfeef9c10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000411f1347fc3c2b370fcf547bbc2fb4e2d0264a237e3754b8f5c016489c7ba25a9e6673f834c324321f683887db2db20bb4421d1861235e490f18c011bee4da36f21c00000000000000000000000000000000000000000000000000000000000000',
            to: '0xAecDFD3A19f777F0c03e6bf99AAfB59937d6467b',
          },
          {
            data: '0x6a761202000000000000000000000000ccb0f4cf5d3f97f4a55bb5f5ca321c3ed033f2440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001a0000000000000000000000000000000000000000000000000000000000000002467a5cd0600000000000000000000000037f03a12241e9fd3658ad6777d289c3fb8512bc9000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041f81b60bc21fd7baa56fdf495a27c76a2facbbe986e866c0e2a724c3167b2c66f020cdb9ce4da91b2a16dce4f219dd74454826d04d3750941e490ea4c5a5fb5141c00000000000000000000000000000000000000000000000000000000000000',
            to: '0xAecDFD3A19f777F0c03e6bf99AAfB59937d6467b',
          },
          {
            data: '0x6a761202000000000000000000000000ccb0f4cf5d3f97f4a55bb5f5ca321c3ed033f2440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001a0000000000000000000000000000000000000000000000000000000000000002467a5cd06000000000000000000000000398106564948feeb1fedea0709ae7d969d62a391000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041bfdc9658799432f3f9d5281a87d857eafdd1fed7cd1994c48231525459e2b122038d21062e4f7068f1e439add912fcaa45b77abcf1a620f45434ab43c5ce0c271c00000000000000000000000000000000000000000000000000000000000000',
            to: '0xAecDFD3A19f777F0c03e6bf99AAfB59937d6467b',
          },
        ]);
      });
    });

    describe('getSafeAddressFromMultiSend', () => {
      let isExecTransactionCallSpy: jest.SpyInstance;
      let isSafeContractSpy: jest.SpyInstance;

      beforeEach(() => {
        jest.restoreAllMocks();

        isExecTransactionCallSpy = jest.spyOn(
          txHelpers,
          'isExecTransactionCall',
        );
        isSafeContractSpy = jest.spyOn(safeHelpers, 'isSafeContract');
      });

      it('should return the address of the Safe that the multisend is being sent to', async () => {
        const result = await txHelpers.getSafeAddressFromMultiSend(
          '5',
          MOCK_MULTISEND_TX_CALL_DATA,
        );
        axios.default.get = jest.fn().mockResolvedValue({ data: 'mockSafe' });

        expect(result).toBe('0xAecDFD3A19f777F0c03e6bf99AAfB59937d6467b');

        // Mock data contains 6 multisend transactions
        expect(isExecTransactionCallSpy).toHaveBeenCalledTimes(6);

        expect(isSafeContractSpy).toHaveBeenCalledTimes(1);
      });

      it('should return undefined if the multisend is empty', async () => {
        jest.spyOn(txHelpers, 'decodeMultiSendTxs').mockReturnValue([]);

        const result = await txHelpers.getSafeAddressFromMultiSend(
          '5',
          MOCK_MULTISEND_TX_CALL_DATA,
        );
        expect(result).toBeUndefined();

        expect(isExecTransactionCallSpy).not.toHaveBeenCalled();

        expect(isSafeContractSpy).not.toHaveBeenCalled();
      });

      it('should return undefined if the multisend contains non-execTransaction transactions', async () => {
        jest.spyOn(txHelpers, 'decodeMultiSendTxs').mockReturnValue([
          {
            data: '0x123',
            to: '0xAecDFD3A19f777F0c03e6bf99AAfB59937d6467b',
          },
        ]);

        const result = await txHelpers.getSafeAddressFromMultiSend(
          '5',
          MOCK_MULTISEND_TX_CALL_DATA,
        );
        expect(result).toBeUndefined();

        expect(isExecTransactionCallSpy).toHaveBeenCalledTimes(1);

        expect(isSafeContractSpy).not.toHaveBeenCalled();
      });

      it('should return undefined if the multisend has varying recipients', async () => {
        jest.spyOn(txHelpers, 'decodeMultiSendTxs').mockReturnValue([
          {
            data: '0x6a761202000000000000000000000000ccb0f4cf5d3f97f4a55bb5f5ca321c3ed033f2440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001a0000000000000000000000000000000000000000000000000000000000000002467a5cd0600000000000000000000000037f03a12241e9fd3658ad6777d289c3fb8512bc9000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041f81b60bc21fd7baa56fdf495a27c76a2facbbe986e866c0e2a724c3167b2c66f020cdb9ce4da91b2a16dce4f219dd74454826d04d3750941e490ea4c5a5fb5141c00000000000000000000000000000000000000000000000000000000000000',
            to: '0xAecDFD3A19f777F0c03e6bf99AAfB59937d6467b',
          },
          {
            data: '0x6a761202000000000000000000000000ccb0f4cf5d3f97f4a55bb5f5ca321c3ed033f2440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001a0000000000000000000000000000000000000000000000000000000000000002467a5cd06000000000000000000000000398106564948feeb1fedea0709ae7d969d62a391000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041bfdc9658799432f3f9d5281a87d857eafdd1fed7cd1994c48231525459e2b122038d21062e4f7068f1e439add912fcaa45b77abcf1a620f45434ab43c5ce0c271c00000000000000000000000000000000000000000000000000000000000000',
            to: '0x123',
          },
        ]);

        const result = await txHelpers.getSafeAddressFromMultiSend(
          '5',
          MOCK_MULTISEND_TX_CALL_DATA,
        );
        expect(result).toBeUndefined();

        expect(isExecTransactionCallSpy).toHaveBeenCalledTimes(2);

        expect(isSafeContractSpy).not.toHaveBeenCalled();
      });

      it('should return undefined if the addresss is not that of a Safe', async () => {
        axios.default.get = jest
          .fn()
          .mockImplementation(() => Promise.reject());

        const result = await txHelpers.getSafeAddressFromMultiSend(
          '5',
          MOCK_MULTISEND_TX_CALL_DATA,
        );
        expect(result).toBeUndefined();

        // Mock data contains 6 multisend transactions
        expect(isExecTransactionCallSpy).toHaveBeenCalledTimes(6);

        expect(isSafeContractSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('isValidMultiSendCall', () => {
      const chainId = '5';
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const multiSendAddress = deployments.getMultiSendCallOnlyDeployment({
        network: chainId,
      })!.defaultAddress;

      let isMultiSendCallSpy: jest.SpyInstance;
      let getMultiSendCallOnlyDeploymentSpy: jest.SpyInstance;

      beforeEach(() => {
        jest.restoreAllMocks();

        isMultiSendCallSpy = jest.spyOn(txHelpers, 'isMultiSendCall');
        getMultiSendCallOnlyDeploymentSpy = jest.spyOn(
          deployments,
          'getMultiSendCallOnlyDeployment',
        );
      });

      it('should return true for a valid multisend', async () => {
        axios.default.get = jest.fn().mockResolvedValue({ data: 'mockSafe' });

        const result = await txHelpers.isValidMultiSendCall(
          chainId,
          multiSendAddress,
          MOCK_MULTISEND_TX_CALL_DATA,
        );

        expect(result).toBe(true);

        expect(isMultiSendCallSpy).toHaveBeenCalledTimes(1);
        expect(getMultiSendCallOnlyDeploymentSpy).toHaveBeenCalledTimes(1);
      });

      it('should return false for a invalid multisend calldata', async () => {
        axios.default.get = jest
          .fn()
          .mockImplementation(() => Promise.reject());

        const result = await txHelpers.isValidMultiSendCall(
          chainId,
          multiSendAddress,
          MOCK_EXEC_TX_CALL_DATA,
        );

        expect(result).toBe(false);

        expect(isMultiSendCallSpy).toHaveBeenCalledTimes(1);
        expect(getMultiSendCallOnlyDeploymentSpy).not.toHaveBeenCalled();
      });

      it('should return false unofficial multisend addresses', async () => {
        jest.spyOn(txHelpers, 'decodeMultiSendTxs').mockReturnValue([]);
        jest
          .spyOn(deployments, 'getMultiSendCallOnlyDeployment')
          .mockReturnValue({ defaultAddress: '0x123' } as SingletonDeployment);

        const result = await txHelpers.isValidMultiSendCall(
          chainId,
          '0x456',
          MOCK_MULTISEND_TX_CALL_DATA,
        );

        expect(result).toBe(false);

        expect(isMultiSendCallSpy).toHaveBeenCalledTimes(1);
        expect(getMultiSendCallOnlyDeploymentSpy).toHaveBeenCalledTimes(1);
      });
    });
  });
});
