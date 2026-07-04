FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY src/ ./src/
RUN npm ci && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
    COPY --from=build /app/src/fonts ./dist/fonts
COPY package.json ./

RUN mkdir -p /app/uploads /app/logs && \
    chown -R appuser:nodejs /app/uploads /app/logs

USER appuser
EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
