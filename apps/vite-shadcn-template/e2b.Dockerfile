# Use the official Node.js image
# see all versions at https://hub.docker.com/_/node/tags
FROM node:24.3.0-bookworm

# Install pnpm globally
RUN npm install -g bun

COPY compile_page.sh /compile_page.sh
RUN chmod +x /compile_page.sh

# Create and set working directory
RUN mkdir -p /home/user/vite-shadcn-template-libra
WORKDIR /home/user/vite-shadcn-template-libra

ENV VITE_INSPECTOR_URL=https://cdn.zepid.dev

# Copy everything from the current directory into working directory
COPY . .

# Remove duplicate script from working directory (we want it only in container root)
RUN rm -f compile_page.sh

# Run pnpm install in the project directory
RUN bun install