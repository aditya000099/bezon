# Stage 1: Build the TypeScript backend
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root configurations
COPY package*.json ./
COPY tsconfig.json ./

# Copy all packages and API app
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install workspace dependencies
RUN npm install

# Build the API
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

EXPOSE 5001
CMD ["node", "apps/api/dist/index.js"]
