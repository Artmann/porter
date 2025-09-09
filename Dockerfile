# Use the official Bun image
FROM oven/bun:1

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the app
ENV NODE_ENV=production
RUN bun run build

# Expose port
EXPOSE 3000

# Set environment variables
ENV PORT=3000

# Run the app
USER bun
CMD ["bun", "run", "start"]