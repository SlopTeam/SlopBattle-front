# Build Vite -> fichiers statiques servis par nginx
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build-only

FROM nginx:1.29-alpine
# Back-end root that nginx proxies /graphql and /auth/google to, e.g. http://api:3000 (no /graphql).
# Set it in the stack; left empty, those routes answer 503 and the static site still works.
ENV BACKEND_UPSTREAM=""
# Lets the template resolve the back-end name with the container's own DNS servers
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
