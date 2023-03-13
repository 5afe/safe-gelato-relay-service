export const SafeInfoService = Symbol('ISafeInfoService');

export interface ISafeInfoService {
  isSafeContract(chainId: string, address: string): Promise<boolean>;
}
