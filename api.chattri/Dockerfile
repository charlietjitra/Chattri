FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY tsconfig.json ./tsconfig.docker.json
COPY src ./src/

RUN npm install

RUN npx prisma generate

RUN npx tsc -p tsconfig.docker.json

EXPOSE 8888

CMD ["node", "dist/index.js"]