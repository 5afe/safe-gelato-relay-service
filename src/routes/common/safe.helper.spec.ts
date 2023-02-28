import * as axios from 'axios';

import { isSafeContract } from './safe.helper';

describe('Safe helpers', () => {
  describe('isSafeContract', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.resetAllMocks();
    });

    it('should return true if the address is a Safe', async () => {
      axios.default.get = jest.fn().mockResolvedValue({ data: 'mockSafe' });

      const result = await isSafeContract('5', '0x123');
      expect(result).toBe(true);
    });

    it('should return false if the address is not a Safe', async () => {
      axios.default.get = jest.fn().mockImplementation(() => Promise.reject());

      const result = await isSafeContract('5', '0x123');
      expect(result).toBe(false);
    });
  });
});
