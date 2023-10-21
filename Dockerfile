FROM node:18-alpine3.18

MAINTAINER ilya <sizov.ilya1996@gmail.com>

RUN apk update && apk add openssl nodejs

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run prisma:generate

CMD ["npm", "run", "start:dev"]
