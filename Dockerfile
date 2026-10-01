# syntax=docker/dockerfile:1

# =============================================================================
# ComplianceIQ — production container (multi-stage)
#   Stage 1 (builder): install ALL deps, build the SPA + bundle the server.
#   Stage 2 (runtime): copy only prod deps + built artifacts + region data.
# Produces a small image that runs `node dist/server.mjs` and serves both the
# API and the built React SPA on $PORT (default 3000), bound to 0.0.0.0.
# =============================================================================

# ---- Stage 1: build --------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (better layer caching).
# --legacy-peer-deps matches the local install: Vite 8 declares a newer esbuild
# peer range than the pinned esbuild ^0.25, which strict `npm ci` would reject.
# This does not change any resolved versions (the lockfile stays authoritative).
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy the rest of the source and build (Vite SPA -> dist/, esbuild -> dist/server.mjs).
COPY . .
RUN npm run build

# Drop dev dependencies so we can copy a lean node_modules into the runtime stage.
RUN npm prune --omit=dev --legacy-peer-deps

# ---- Stage 2: runtime ------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
# PORT is overridable at runtime (ALB/task definition sets it). Default 3000.
ENV PORT=3000

# Run as the built-in non-root `node` user for security.
# Copy production node_modules and built artifacts from the builder.
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/package.json ./package.json

# Region data. In non-prod this ships in the image; in prod you may instead
# mount a persistent volume at /app/data (set DATA_DIR=/app/data) so admin
# edits survive restarts. The loader resolves DATA_DIR first, then this path.
COPY --from=builder --chown=node:node /app/data ./data

USER node

EXPOSE 3000

# Lightweight container healthcheck hits the app's own health endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/server.mjs"]
