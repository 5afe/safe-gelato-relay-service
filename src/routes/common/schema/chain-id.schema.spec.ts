import { SupportedChainId } from '../../../config/constants';
import { ChainIdSchema } from './chain-id.schema';

describe('ChainIdSchema', () => {
  it('should validate a valid address', () => {
    Object.values(SupportedChainId).forEach((chainId) => {
      const result = ChainIdSchema.safeParse(chainId);

      expect(result.success).toBe(true);
    });
  });

  it('should not validate an invalid address', () => {
    [true, '', 'abc', '1.23', 123, '0x123'].forEach((address) => {
      const result = ChainIdSchema.safeParse(address);

      expect(result.success).toBe(false);
    });
  });
});
