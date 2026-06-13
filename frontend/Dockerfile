# Frontend image: build the React/Vite SPA, then serve it from nginx, which also
# reverse-proxies /api/* to the backend so the browser talks to one origin (no
# CORS). VITE_API_URL is baked at build time and defaults to the proxy path.
FROM node:20-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
