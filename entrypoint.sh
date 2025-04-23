#!/bin/sh

echo "window.env = {
  VITE_ROOT_URL: \"${VITE_ROOT_URL}\",
  VITE_BACKEND_URL: \"${VITE_BACKEND_URL}\",
  VITE_KEYCLOAK_URL: \"${VITE_KEYCLOAK_URL}\",
  VITE_KEYCLOAK_REALM: \"${VITE_KEYCLOAK_REALM}\",
  VITE_KEYCLOAK_CLIENT: \"${VITE_KEYCLOAK_CLIENT}\",
};" > /usr/share/nginx/html/env.js

envsubst '$VITE_BACKEND_URL $VITE_KEYCLOAK_URL' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

exec "$@"