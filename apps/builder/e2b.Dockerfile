# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:slim AS base

# Create and set working directory
WORKDIR /home/user/vite-shadcn-template-zepid


# Copy everything from the current directory into working directory
COPY . .

# Run bun install in the project directory
RUN bun install

# Fix permissions for Wrangler directory creation
# Create .wrangler directory and set proper permissions
RUN mkdir -p .wrangler/tmp && \
    chmod -R 777 .wrangler && \
    chmod -R 755 /home/user/vite-shadcn-template-zepid || true

# Run the development server
CMD ["bun", "run", "dev"]