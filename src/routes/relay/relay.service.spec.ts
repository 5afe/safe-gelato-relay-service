import { _getRelayGasLimit } from './relay.service';

describe('RelayService', () => {
  describe('getRelayGasLimit', () => {
    it('should return undefined if no gasLimit is provided', () => {
      expect(_getRelayGasLimit()).toBe(undefined);
    });

    it('should return the gasLimit plus the buffer', () => {
      const GAS_LIMIT_BUFFER = 150_000;

      expect(_getRelayGasLimit('100000')).toBe(
        BigInt(100000) + BigInt(GAS_LIMIT_BUFFER),
      );
    });
  });
});
