FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY producer ./producer
EXPOSE 3000
CMD ["node", "producer/src/index.js"]