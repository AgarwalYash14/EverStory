FROM alpine:3.18

RUN apk add --no-cache curl bash

WORKDIR /app
COPY setup-kong.sh /app/
RUN chmod +x /app/setup-kong.sh

CMD ["/app/setup-kong.sh"]