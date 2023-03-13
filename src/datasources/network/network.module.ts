import { Global, Module } from '@nestjs/common';
import { AxiosNetworkService } from './axios.network.service';
import axios from 'axios';

import { NetworkService } from './network.service.interface';

@Global()
@Module({
  providers: [
    {
      provide: 'AxiosClient',
      useFactory: () => {
        return axios.create();
      },
    },
    { provide: NetworkService, useClass: AxiosNetworkService },
  ],
  exports: [NetworkService],
})
export class NetworkModule {}
