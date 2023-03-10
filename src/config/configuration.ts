import { z } from 'zod';

import { SupportedChainId } from './constants';

const ConfigurationSchema = z.object({
  applicationPort: z.string(),
  relay: z.object({
    ttl: z.number(),
    limit: z.number(),
  }),
  gelato: z.object({
    apiKey: z.object({
      [SupportedChainId.GOERLI]: z.string(),
      [SupportedChainId.GNOSIS_CHAIN]: z.string(),
    }),
  }),
  gatewayUrl: z.string(),
});

export default () => {
  return ConfigurationSchema.parse({
    applicationPort: process.env.APPLICATION_PORT || '3000',
    relay: {
      ttl: process.env.THROTTLE_TTL
        ? Number(process.env.THROTTLE_TTL)
        : 60 * 60, // 1 hour
      limit: process.env.THROTTLE_LIMIT
        ? Number(process.env.THROTTLE_LIMIT)
        : 5,
    },
    gelato: {
      apiKey: {
        [SupportedChainId.GOERLI]: process.env.GELATO_GOERLI_API_KEY,
        [SupportedChainId.GNOSIS_CHAIN]:
          process.env.GELATO_GNOSIS_CHAIN_API_KEY,
      },
    },
    gatewayUrl: process.env.GATEWAY_URL || 'https://safe-client.safe.global',
  });
};
