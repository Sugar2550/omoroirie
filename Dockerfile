# ================================
# Build stage
# ================================
FROM node:20-alpine AS builder
WORKDIR /app

# Install all dependencies (including devDependencies)
COPY package*.json ./
RUN npm ci

# Copy source files and build
COPY tsconfig.json ./
COPY . .
RUN npm run build


# ================================
# Runtime stage
# ================================
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built JavaScript files
COPY --from=builder /app/dist ./dist

# Copy runtime data files (重要)
COPY --from=builder /app/data ./data

# Start the bot
CMD ["node", "dist/bot.js"]
