# Safe Gelato Relay Service

[![Coverage Status](https://coveralls.io/repos/github/5afe/safe-gelato-relay-service/badge.svg?branch=main)](https://coveralls.io/github/5afe/safe-gelato-relay-service?branch=main)

## Installation

```bash
corepack enable && yarn install
```

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Running service locally

```bash
# start service
docker-compose up -d

# stop service
docker-compose stop
```
