FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build frontend and backend
# Assumes 'npm run build' runs 'tsc' and 'vite build'
RUN npm run build
RUN npm prune --production

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose API port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
