#
# BUILD CONTAINER
#
FROM node:21 as base
ENV NODE_ENV production
WORKDIR /app
COPY --chown=node:node .yarn/releases ./.yarn/releases
COPY --chown=node:node .yarn/plugins ./.yarn/plugins
COPY --chown=node:node package.json yarn.lock .yarnrc.yml tsconfig*.json ./
RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn workspaces focus --production
COPY src ./src
RUN yarn run build

#
# PRODUCTION CONTAINER
#
FROM node:21-alpine as production
USER node
COPY --chown=node:node --from=base /app/node_modules ./node_modules
COPY --chown=node:node --from=base /app/dist ./dist
CMD [ "node", "dist/main.js" ]
