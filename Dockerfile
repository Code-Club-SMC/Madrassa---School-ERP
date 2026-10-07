FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat python3 make g++

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

ENV NODE_ENV=production
ENV NITRO_PRESET=node-server
RUN npm run build

RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENV DATABASE_URL="postgres://postgres:postgres@postgres:5432/msmis"
ENV PORT="3000"
ENV NODE_ENV="production"

ENTRYPOINT ["./docker-entrypoint.sh"]
