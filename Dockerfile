#
# BUILD CONTAINER
#
FROM node:18 as base
USER node
ENV NODE_ENV production
WORKDIR /app
COPY --chown=node:node .yarn/releases ./.yarn/releases
COPY --chown=node:node package.json yarn.lock .yarnrc.yml tsconfig*.json ./
RUN --mount=type=cache,target="${HOME}/.yarn" YARN_CACHE_FOLDER="${HOME}/.yarn" yarn install --immutable
COPY src/ ./
RUN yarn run build

#
# PRODUCTION CONTAINER
#
FROM node:18-alpine as production
USER node
COPY --chown=node:node --from=base /app/node_modules ./node_modules
COPY --chown=node:node --from=base /app/dist ./dist
CMD [ "node", "dist/main.js" ]
