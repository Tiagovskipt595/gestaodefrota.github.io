# ---- Dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY backend/package.json ./backend/
RUN npm ci --workspace backend

# ---- Build ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/package.json ./backend/package.json
COPY backend/ ./backend/
RUN npm run build --workspace backend

# ---- Release ----
FROM node:20-alpine AS release
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./backend/dist
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "backend/dist/index.js"]
