FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install -g ts-node typescript
RUN npm install

COPY ../.. .

CMD ["ts-node", "-r", "tsconfig-paths/register", "src/apps/smart-contract-comparison/index.ts"]

