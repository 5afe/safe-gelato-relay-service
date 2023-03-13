import { Axios } from 'axios';
import { faker } from '@faker-js/faker';

import { AxiosNetworkService } from './axios.network.service';

const axios = {
  get: jest.fn(),
  post: jest.fn(),
} as unknown as Axios;

const axiosMock = jest.mocked<Axios>(axios);

describe('AxiosNetworkService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const target = new AxiosNetworkService(axiosMock);

  describe('GET requests', () => {
    it('get calls axios get', async () => {
      const url = faker.internet.url();

      await target.get(url);

      expect(axiosMock.get).toBeCalledTimes(1);
      expect(axiosMock.get).toBeCalledWith(url);
    });
  });

  describe('POST requests', () => {
    it('post calls axios post', async () => {
      const url = faker.internet.url();
      const data = { [faker.random.word()]: faker.random.alphaNumeric() };

      await target.post(url, data);

      expect(axiosMock.post).toBeCalledTimes(1);
      expect(axiosMock.post).toBeCalledWith(url, data);
    });
  });
});
