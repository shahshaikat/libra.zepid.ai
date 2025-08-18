FROM node:24.3.0-bookworm-slim

USER root

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/* \
    && npm install -g bun

COPY prepare-daytona.sh /prepare-daytona.sh
RUN chmod +x /prepare-daytona.sh

RUN mkdir -p /home/user/vite-shadcn-template-libra
WORKDIR /home/user/vite-shadcn-template-libra

ENV VITE_INSPECTOR_URL=https://cdn.zepid.dev

COPY . .

RUN rm -f prepare-daytona.sh

RUN bun install

RUN mkdir -p .wrangler/tmp && \
    chmod -R 755 .wrangler || true

EXPOSE 5173

CMD ["/prepare-daytona.sh"]
