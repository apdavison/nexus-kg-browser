#
# From the top-level directory, run:
#
#   docker build -t cnrsunic/nexus-kg-browser -f deployment/Dockerfile .
#


FROM nginx
MAINTAINER andrew.davison@unic.cnrs-gif.fr

COPY deployment/nginx_default /etc/nginx/sites-enabled/default
COPY app /usr/share/nginx/html/app
COPY node_modules /usr/share/nginx/html/node_modules
RUN chmod a+rw /usr/share/nginx/html

VOLUME /usr/share/nginx/html