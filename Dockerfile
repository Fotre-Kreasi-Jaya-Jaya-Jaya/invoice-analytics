# ─────────────────────────────
# Invoice Analytics AI - Dockerfile
# Optimized multi-stage build with layer caching & instant --chown
# Next.js 15 Standalone + Prisma + OCR
# ─────────────────────────────

# ── Stage 1: Base ──
FROM node:24-alpine AS base
RUN apk add --no-cache tini curl

# ── Stage 2: Dependencies (cached unless package*.json changes) ──
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# ── Stage 3: Builder ──
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copy prisma schema first (cached unless schema changes)
COPY prisma ./prisma
RUN npx prisma generate
# Copy source code
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# ── Stage 4: Production Runner ──
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
EXPOSE 3000

# Install OCR dependencies
RUN apk add --no-cache \
    poppler-utils \
    poppler \
    tesseract-ocr \
    libpng \
    jpeg

# Create non-root user and storage directory
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/storage && \
    chown -R nextjs:nodejs /app/storage

# Copy files directly with correct ownership & execution permission (zero redundant RUN layers)
COPY --chown=nextjs:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs --from=builder /app/prisma ./prisma
COPY --chown=nextjs:nodejs --from=builder /app/.next/standalone ./
COPY --chown=nextjs:nodejs --from=builder /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs --from=builder /app/public ./public
COPY --chown=nextjs:nodejs --from=builder /app/package.json ./package.json
COPY --chown=nextjs:nodejs --chmod=755 docker-entrypoint.sh ./

USER nextjs

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["./docker-entrypoint.sh"]