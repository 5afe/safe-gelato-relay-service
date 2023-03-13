import { Inject, Injectable } from '@nestjs/common';
import { Axios } from 'axios';

import { INetworkService } from './network.service.interface';
import { NetworkResponse } from './entities/network.response.entity';

@Injectable()
export class AxiosNetworkService implements INetworkService {
  constructor(@Inject('AxiosClient') private readonly client: Axios) {}

  async get<T = any, R = NetworkResponse<T>>(url: string): Promise<R> {
    return this.client.get(url);
  }

  async post<T = any, R = NetworkResponse<T>>(
    url: string,
    data: Record<string, unknown>,
  ): Promise<R> {
    return this.client.post(url, data);
  }
}
