# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json pnpm-workspace.yaml .npmrc ./
RUN corepack enable && corepack prepare --activate
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install
COPY . .
RUN pnpm run build

# Stage 2: Serve with Nginx
FROM nginx:latest
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/health || exit 1
LABEL org.opencontainers.image.title="matching-frontend"
LABEL org.opencontainers.image.description="Dual-AI Agent Matchmaking Platform - Frontend"
LABEL org.opencontainers.image.version="1.0.0"
CMD ["nginx", "-g", "daemon off;"]
