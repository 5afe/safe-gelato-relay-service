export default () => ({
  about: {
    name: 'safe-gelato-relay-service',
  },
  applicationPort: process.env.APPLICATION_PORT || '3000',
  throttle: {
    ttl: process.env.THROTTLE_TTL || 60,
    limit: process.env.THROTTLE_LIMIT || 5,
  },
});
