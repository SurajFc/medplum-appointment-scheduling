# --- deps
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# --- build
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_MEDPLUM_BASE_URL=https://api.medplum.com/
ENV NEXT_PUBLIC_MEDPLUM_BASE_URL=$NEXT_PUBLIC_MEDPLUM_BASE_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- runtime
FROM node:20-alpine AS runtime
RUN apk add --no-cache dumb-init curl
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1
ENTRYPOINT ["dumb-init","--"]
CMD ["node","server.js"]
