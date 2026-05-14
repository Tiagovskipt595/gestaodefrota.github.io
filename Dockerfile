# ---- Builder ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY backend/ ./backend/
RUN npx tsc --project backend/tsconfig.json

# ---- Release ----
FROM node:20-alpine
WORKDIR /app/backend
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/index.js"]
