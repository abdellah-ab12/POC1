#!/bin/sh
set -e

sed -i "s|__USERS_API_URL__|${VITE_USERS_API_URL}|g" /usr/share/nginx/html/assets/*.js
sed -i "s|__ORDERS_API_URL__|${VITE_ORDERS_API_URL}|g" /usr/share/nginx/html/assets/*.js
sed -i "s|__NOTIFICATIONS_API_URL__|${VITE_NOTIFICATIONS_API_URL}|g" /usr/share/nginx/html/assets/*.js

exec nginx -g "daemon off;"
