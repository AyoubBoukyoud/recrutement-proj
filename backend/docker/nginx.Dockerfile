FROM nginx:1.27-alpine

COPY public /var/www/html/public
COPY docker/nginx.prod.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
