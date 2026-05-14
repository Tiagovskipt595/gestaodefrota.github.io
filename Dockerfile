# ---- Base image ----
FROM node:20-alpine AS base
WORKDIR /app

# ---- Copy root lockfiles and package.json ----
COPY package*.json ./

# ---- Copy backend source ----
COPY backend/ ./backend/

# ---- Install backend dependencies only (using workspace lockfile) ----
RUN npm ci --workspace backend

# ---- Build TypeScript for backend ----
RUN npm run build --workspace backend

# ---- Release image ----
FROM node:20-alpine AS release
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./backend/dist
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "backend/dist/index.js"]