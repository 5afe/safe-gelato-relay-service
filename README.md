# Safe Gelato Relay Service

[![Coverage Status](https://coveralls.io/repos/github/5afe/safe-gelato-relay-service/badge.svg?branch=main)](https://coveralls.io/github/5afe/safe-gelato-relay-service?branch=main)

**⚠️ Warning: This service is currently undergoing active development. Functionality might change considerably.**

The Safe Gelato Relay Service is a web service which allows relaying transactions via the 
[Gelato Relay Service](https://docs.gelato.network/developer-services/relay).

This allows for an entity to sponsor on-chain transactions on behalf of the user, allowing them
to submit Safe transactions without the need to have a wallet with funds. Fee collection can happen via other means
but it is currently not covered.

## Docker

Development images are currently being published to [Docker Hub](https://hub.docker.com/r/safeglobal/safe-gelato-relay-service).


## Requirements

- Node 20.10 (LTS) – https://nodejs.org/en/
- Gelato's 1Balance API key – https://docs.gelato.network/developer-services/relay/payment-and-fees/1balance#production 

## Installation

```bash
corepack enable && yarn install
```

## Running the service

Before running the service you need to set up a Gelato API Key – https://docs.gelato.network/developer-services/relay/payment-and-fees/1balance#production.
This can be added via an environment variable in the local environment where you are executing the service:

Currently three chains are supported: Goerli (chainId=5), Gnosis Chain (chainId=100) and Sepolia (chainId=11155111).
```bash
# To configure Goerli
export GELATO_GOERLI_API_KEY=<GOERLI_GELATO_API_KEY>

# To configure Gnosis Chain
export GELATO_GNOSIS_CHAIN_API_KEY=<GNOSIS_GELATO_API_KEY>

# To configure Sepolia
export GELATO_SEPOLIA_API_KEY=<SEPOLIA_GELATO_API_KEY>
```

All the chains can be configured simultaneously.

---

With the API keys configured, to run the service locally:

```bash
yarn run start
```

The service will then be listening for requests under `$APPLICATION_PORT`. If `$APPLICATION_PORT` was not set, the default
port is `3000`.

Other execution modes are available for local development:

```bash
# Run in watch mode (live-reload)
yarn run start:dev

# Run in debug mode (if you want to attach a debugger)
yarn run start:debug

# Launch the service without the NestJS CLI (production target)
yarn run start:prod
```

## Test

If you want to execute the tests for the service, you can execute the following:

```bash
yarn run test
```

Additionally, if you want the test coverage to be generated, you can execute the following:

```bash
yarn run test:cov
```

By default, the coverage results will be under `<PROJ_FOLDER>/coverage/`.

## Linter and Style Guide

We use [ESLint](https://eslint.org/) as a linter and [Prettier](https://prettier.io/) as a code formatter.
You can run `yarn run lint` to execute ESLint and `yarn run format` to execute Prettier.

These checks can be automatically executed using Git hooks. If you wish to install the provided git hooks:
```shell
yarn install
yarn husky install
```
