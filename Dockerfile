#
# BUILD CONTAINER
#
FROM node:18 as base
ENV NODE_ENV production
WORKDIR /app
COPY .yarn/releases ./.yarn/releases
COPY package.json yarn.lock .yarnrc.yml tsconfig*.json ./
RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn install --immutable
COPY src/ ./
RUN yarn run build

#
# PRODUCTION CONTAINER
#
FROM node:18-alpine as production
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
CMD [ "node", "dist/main.js" ]
