# Multi-stage build for the Next.js frontend.
FROM node:20-slim AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN npm install

COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
RUN npm run build --workspace apps/web

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace", "apps/web"]
