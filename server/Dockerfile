FROM node:20-slim

# Install system dependencies required for native compilation of better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies (including devDependencies needed for build)
RUN npm install

# Copy application source
COPY . .

# Build TypeScript and assets
RUN npm run build

# Create data directory for SQLite
RUN mkdir -p data

# Default environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_DIR=/app/data

EXPOSE 3001

# Start the server using tsx
CMD ["npm", "start"]
