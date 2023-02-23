import { MockThrottlerStorage } from './throttler-storage.mock';

describe('MockThrottlerStorage', () => {
  it('increments the number of throttles correctly', async () => {
    const mockThrottlerStorageService = new MockThrottlerStorage();

    await mockThrottlerStorageService.increment('0x123', 60);
    await mockThrottlerStorageService.increment('0x123', 60);

    expect(mockThrottlerStorageService.storage).toEqual({
      '0x123': {
        expiresAt: expect.any(Number),
        totalHits: 2,
      },
    });
  });
});
