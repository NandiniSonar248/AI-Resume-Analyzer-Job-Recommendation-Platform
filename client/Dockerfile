# ==============================================================================
# Client Dockerfile — React (Vite) + Nginx (Production)
# ==============================================================================
# Stage 1 (builder): Installs all deps and runs `npm run build` → /app/dist
# Stage 2 (runtime): Copies only the built /dist into nginx — no Node.js needed
# This keeps the final image tiny (~25 MB vs ~800 MB with Node).
# ==============================================================================

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install all dependencies (including devDependencies needed for the build)
RUN npm ci

# Copy source code
COPY . .

# Build the production bundle into /app/dist
RUN npm run build

# ── Stage 2: Serve ───────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Remove default nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (handles SPA routing + API proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# nginx listens on port 80 (mapped to host port by docker-compose)
EXPOSE 80

# Run as non-root (nginx 1.19+ supports this)
RUN chown -R nginx:nginx /usr/share/nginx/html && chmod -R 755 /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]
