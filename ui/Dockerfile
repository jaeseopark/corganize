FROM node:21-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build --production

FROM nginx:stable-alpine

COPY --from=build /app/build /usr/share/nginx/html
