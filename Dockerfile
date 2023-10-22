FROM node:18-alpine

MAINTAINER ilya <sizov.ilya1996@gmail.com>

RUN apk update && apk add openssl

WORKDIR /usr/src/app

ENV NODE_ENV production

COPY package*.json ./

COPY . .

RUN npm ci && npm cache clean --force

RUN npm run prisma:generate

RUN npm run build

USER node

#CMD ["npm", "run", "start:dev"]
CMD ["node", "dist/main"]
