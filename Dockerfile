FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

ARG VITE_API_URL
ARG VITE_KEYCLOAK_URL
ARG VITE_KEYCLOAK_REALM
ARG VITE_KEYCLOAK_CLIENT_ID
ARG VITE_PLATEFORM_URL
ARG VITE_CRM_URL
ARG VITE_CRM_API_URL
ARG VITE_DISABLE_AUTH

RUN npm run build

FROM node:22-alpine
RUN npm install -g serve
WORKDIR /app
COPY --from=build /app/dist ./dist
ENV PORT=3000
EXPOSE 3000
CMD serve -s dist -l tcp://0.0.0.0:$PORT
