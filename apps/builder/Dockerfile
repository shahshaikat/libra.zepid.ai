FROM node:24.3.0-bookworm-slim

RUN npm install -g bun

# Create and set working directory
RUN mkdir -p /home/user/vite-shadcn-template-builder-zepid
# Create and set working directory
WORKDIR /home/user/vite-shadcn-template-builder-zepid

# Copy everything from the current directory into working directory
COPY . .

# Run bun install in the project directory
RUN bun install

# Fix permissions for Wrangler directory creation
# Create .wrangler directory and set proper permissions
RUN mkdir -p .wrangler/tmp && \
    chmod -R 777 .wrangler && \
    chmod -R 755 /home/user/vite-shadcn-template-builder-zepid || true

# Run bun install in the project directory
RUN bun install

# Expose the port that Vite dev server runs on
EXPOSE 5173

# Run the development server
CMD ["bun", "run", "dev", "--host", "0.0.0.0"]