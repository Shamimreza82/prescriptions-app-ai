FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json next.config.js tsconfig.json ./
COPY src/ ./src/
COPY public/ ./public/
RUN npm ci && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 nextjs
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
USER nextjs
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
