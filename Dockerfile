# ---- Base image ----
FROM node:20-alpine AS base
WORKDIR /app

# ---- Install dependencies ----
FROM base AS deps
COPY backend/package*.json ./
RUN npm ci

# ---- Build TypeScript ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY backend/ ./backend/
COPY frontend/ ./frontend/
RUN npm run build --prefix backend

# ---- Release image ----
FROM base AS release
WORKDIR /app
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
# Copy any needed root files (like .env if you want to bake in, but better to use env at runtime)
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "backend/dist/index.js"]