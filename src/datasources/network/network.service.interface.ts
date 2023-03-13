import { NetworkResponse } from './entities/network.response.entity';

export const NetworkService = Symbol('INetworkService');

export interface INetworkService {
  get<T = unknown, R = NetworkResponse<T>>(url: string): Promise<R>;

  post<T = unknown, R = NetworkResponse<T>>(
    url: string,
    data: Record<string, unknown>,
  ): Promise<R>;
}
