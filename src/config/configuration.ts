import { SupportedChainId } from './constants';

export default () => ({
  about: {
    name: 'safe-gelato-relay-service',
  },
  applicationPort: process.env.APPLICATION_PORT || '3000',
  gelato: {
    apiKey: {
      [SupportedChainId.GOERLI]: process.env.GELATO_GOERLI_API_KEY,
      [SupportedChainId.GNOSIS_CHAIN]: process.env.GELATO_GNOSIS_CHAIN_API_KEY,
    },
  },
});
