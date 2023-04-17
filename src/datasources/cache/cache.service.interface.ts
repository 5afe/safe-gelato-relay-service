export const CacheService = Symbol('ICacheService');

export interface ICacheService {
  get(key: string): Promise<string | null>;

  set(key: string, value: string, ttl?: number): Promise<void>;
}
