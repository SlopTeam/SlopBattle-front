# Build Vite -> fichiers statiques servis par nginx
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build-only

FROM nginx:1.29-alpine
# Back-end that nginx proxies /graphql and /auth/google to, e.g. http://api:3000.
# Set it in the stack; left empty, those routes answer 503 and the static site still works.
ENV BACKEND_UPSTREAM=""
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
