# HumanLift server images: one file, three targets (api, web, admin).
#   docker build --target api   -t humanlift-api .
#   docker build --target web   -t humanlift-web   --build-arg SITE_URL=https://your-domain .
#   docker build --target admin -t humanlift-admin .
# No secrets are baked into images. Runtime secrets come from environment variables.

# The full (non-slim) image already includes OpenSSL and CA certificates, which Prisma needs.
FROM node:22-bookworm AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1 CI=true
RUN corepack enable
WORKDIR /app

FROM base AS build
# Website settings are compiled into the pages, so they are build arguments.
ARG API_URL=http://api:4000
ARG SITE_URL=http://localhost:3000
ARG PUBLIC_ENVIRONMENT=production
ENV API_URL=$API_URL NEXT_PUBLIC_SITE_URL=$SITE_URL NEXT_PUBLIC_ENVIRONMENT=$PUBLIC_ENVIRONMENT
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm -r build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app /app
USER node

FROM runtime AS api
WORKDIR /app/services/api
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:4000/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Apply database migrations (never destructive ones without review), add any missing countries, then start.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node_modules/.bin/tsx prisma/seed.ts && exec node dist/main.js"]

FROM runtime AS web
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "-p", "3000"]

FROM runtime AS admin
WORKDIR /app/apps/admin
EXPOSE 3001
CMD ["node_modules/.bin/next", "start", "-p", "3001"]
