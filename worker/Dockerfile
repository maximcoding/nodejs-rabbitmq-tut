FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY worker ./worker
CMD ["node", "worker/src/index.js"]