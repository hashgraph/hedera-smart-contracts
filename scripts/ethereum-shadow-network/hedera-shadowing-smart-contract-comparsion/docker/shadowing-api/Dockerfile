FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install -g ts-node typescript
RUN npm install

COPY ../.. .

EXPOSE 3005
EXPOSE 8085

CMD ["ts-node", "src/apps/shadowing-api/index.ts"]
