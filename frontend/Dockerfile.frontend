FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY index.html /usr/share/nginx/html/
COPY momento_modules.js /usr/share/nginx/html/
COPY src/ /usr/share/nginx/html/src/
COPY vendor/ /usr/share/nginx/html/vendor/
COPY ["just logo.png", "/usr/share/nginx/html/just logo.png"]
COPY ["logo-clean.png", "/usr/share/nginx/html/logo-clean.png"]
COPY ["opening page image.png", "/usr/share/nginx/html/opening page image.png"]
COPY moment-icon.svg /usr/share/nginx/html/
COPY momento-icon.svg /usr/share/nginx/html/

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
