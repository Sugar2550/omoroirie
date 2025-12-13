# Multi-stage build for smaller runtime image
FROM node:20-alpine AS builder
WORKDIR /app

# Install all deps (including devDependencies for build)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY tsconfig.json ./
COPY . .
RUN npm run build

# Runtime image
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built artifacts
COPY --from=builder /app/dist ./dist

# Start the bot
CMD ["node", "dist/bot.js"]