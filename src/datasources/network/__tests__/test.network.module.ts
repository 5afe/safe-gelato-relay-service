import { Global, Module } from '@nestjs/common';

import { NetworkService, INetworkService } from '../network.service.interface';

const networkService: INetworkService = {
  get: jest.fn(),
  post: jest.fn(),
};

export const mockNetworkService = jest.mocked(networkService);

@Global()
@Module({
  providers: [{ provide: NetworkService, useValue: mockNetworkService }],
  exports: [NetworkService],
})
export class TestNetworkModule {}
