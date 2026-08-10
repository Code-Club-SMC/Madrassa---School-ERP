FROM node:24-alpine

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

RUN NITRO_PRESET=node-server npm run build

RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENV DATABASE_URL="postgres://postgres:postgres@postgres:5432/msmis"
ENV BETTER_AUTH_SECRET="change-me"
ENV PORT="3000"
ENV NODE_ENV="production"

CMD ["./docker-entrypoint.sh"]
