FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci

COPY . .

ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV API_BASE_URL=http://api:4000/api/v1

RUN npm --workspace apps/web run build

FROM node:20-alpine AS runtime
WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/app ./apps/web/app
COPY --from=builder /app/apps/web/lib ./apps/web/lib
COPY --from=builder /app/apps/web/next-env.d.ts ./apps/web/next-env.d.ts
COPY --from=builder /app/apps/web/next.config.mjs ./apps/web/next.config.mjs
COPY --from=builder /app/apps/web/tsconfig.json ./apps/web/tsconfig.json
COPY --from=builder /app/packages/shared ./packages/shared

ENV NODE_ENV=production
ENV PORT=3000
ENV API_BASE_URL=http://api:4000/api/v1

WORKDIR /app/apps/web
EXPOSE 3000

CMD ["npm", "run", "start"]
