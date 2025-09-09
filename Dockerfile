# Use Node.js 24 for better React Router SSR compatibility
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies with npm
RUN npm install

# Copy source code
COPY . .

# Build the app
ENV NODE_ENV=production
RUN npm run build

# Expose port
EXPOSE 3000

# Set environment variables
ENV PORT=3000

# Run the app with Node.js for better SSR compatibility
CMD ["npm", "run", "start"]