FROM node:22-alpine AS development

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src/

RUN npm install && npx prisma generate

RUN chown -R node:node /app
USER node

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:dev"]
