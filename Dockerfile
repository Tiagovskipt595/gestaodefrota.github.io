# ---- Builder ----
FROM node:20-alpine AS builder
WORKDIR /app/backend
COPY backend/package.json ./
RUN npm ci
COPY backend/ ./
RUN npx tsc

# ---- Release ----
FROM node:20-alpine
WORKDIR /app/backend
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/index.js"]
