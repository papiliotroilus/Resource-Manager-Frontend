FROM node:lts-alpine AS build
WORKDIR /frontend
COPY . .
RUN npm install
RUN npm run build

FROM nginx:stable-alpine AS production
WORKDIR /usr/share/nginx/html
COPY --from=build /frontend/dist .

RUN echo "window.env = {};" > env.js

COPY nginx.conf /etc/nginx/conf.d/default.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

EXPOSE 80