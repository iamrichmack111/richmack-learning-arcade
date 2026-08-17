FROM nginx:1.27-alpine

LABEL org.opencontainers.image.source="https://github.com/iamrichmack111/richmack-learning-arcade"
LABEL org.opencontainers.image.description="Browser-based learning arcade with student accounts and parent progress tracking"

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html

RUN rm -rf /usr/share/nginx/html/.git     /usr/share/nginx/html/.github     /usr/share/nginx/html/scripts     /usr/share/nginx/html/docs     /usr/share/nginx/html/schemas

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
