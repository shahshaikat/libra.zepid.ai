# use the official Bun image (force amd64 to avoid exec format error on M1/M2 Mac)
FROM --platform=linux/amd64 oven/bun:1.1.22-slim AS base

WORKDIR /home/user/vite-shadcn-template-builder-zepid

# Ensure .wrangler directory exists before install
RUN mkdir -p /home/user/vite-shadcn-template-builder-zepid/.wrangler/tmp && \
    chmod -R 777 /home/user/vite-shadcn-template-builder-zepid

COPY package*.json bun.lockb* ./
RUN bun install

COPY . .

CMD ["bun", "run", "dev"]
