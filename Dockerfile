###################
# BUILD FOR PRODUCTION
###################

FROM node:18-alpine as build

MAINTAINER ilya <sizov.ilya1996@gmail.com>

RUN apk update && apk add openssl

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

RUN npm ci

COPY --chown=node:node . .

RUN npm run prisma:generate

RUN npm run build

#ENV NODE_ENV production

RUN npm ci --omit=dev && npm cache clean --force

USER node

###################
# PRODUCTION
###################

FROM node:18-alpine As production

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/package.json .
COPY --chown=node:node --from=build /usr/src/app/prisma ./prisma
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

#ENV POSTGRES_HOST postgres
#ENV POSTGRES_PORT 5432

#RUN npm run prisma:migrate

CMD ["npm", "run", "start:prod"]
#CMD ["node", "dist/src/main.js"]
