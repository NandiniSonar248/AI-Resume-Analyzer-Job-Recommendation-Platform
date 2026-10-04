# ==============================================================================
# Server Dockerfile — Node.js 20 Alpine (Production)
# ==============================================================================
# Multi-stage is not needed here since server has no build step.
# Uses --only=production to exclude devDependencies (nodemon, etc.)
# ==============================================================================

FROM node:20-alpine

# Install security updates & dumb-init for proper signal handling in containers
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Create app directory & non-root user for security (least privilege)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy manifest files first (Docker layer cache: only re-installs if changed)
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --ignore-scripts

# Copy source code
COPY --chown=appuser:appgroup . .

# Remove test files and dev assets from production image
RUN rm -rf tests/ .env.example .env

# Switch to non-root user
USER appuser

# Expose the server port
EXPOSE 5000

# Health check (Docker marks container unhealthy if server stops responding)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Use dumb-init as PID 1 (handles signals correctly, avoids zombie processes)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
