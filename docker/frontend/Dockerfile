FROM node:22-alpine AS development

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN chown -R node:node /app
USER node

CMD ["npm", "run", "dev", "--", "--host"]
