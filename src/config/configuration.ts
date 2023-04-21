import { SupportedChainId } from './constants';

export default () => ({
  about: {
    name: 'safe-gelato-relay-service',
  },
  applicationPort: process.env.APPLICATION_PORT || '3000',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || '6379',
  },
  relay: {
    ttl: process.env.THROTTLE_TTL ? +process.env.THROTTLE_TTL : 60 * 60, // 1 hour in seconds
    limit: process.env.THROTTLE_LIMIT ? +process.env.THROTTLE_LIMIT : 5,
  },
  gelato: {
    apiKey: {
      [SupportedChainId.GOERLI]: process.env.GELATO_GOERLI_API_KEY,
      [SupportedChainId.GNOSIS_CHAIN]: process.env.GELATO_GNOSIS_CHAIN_API_KEY,
    },
  },
  gatewayUrl: process.env.GATEWAY_URL || 'https://safe-client.safe.global',
});
