FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

FROM base AS build
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run tsc --noEmit

FROM base AS runtime
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Pagsmile API credentials (required)
ARG PAGSMILE_APP_ID
ENV PAGSMILE_APP_ID=${PAGSMILE_APP_ID}

ARG PAGSMILE_SECURITY_KEY
ENV PAGSMILE_SECURITY_KEY=${PAGSMILE_SECURITY_KEY}

ARG PAGSMILE_PUBLIC_KEY
ENV PAGSMILE_PUBLIC_KEY=${PAGSMILE_PUBLIC_KEY}

# Pagsmile environment: "sandbox" or "prod"
ARG PAGSMILE_ENV=prod
ENV PAGSMILE_ENV=${PAGSMILE_ENV}

# Base URL for webhooks and callbacks
ARG BASE_URL
ENV BASE_URL=${BASE_URL}

# Server port
ARG PORT=3001
ENV PORT=${PORT}

EXPOSE ${PORT}

USER bun
CMD ["bun", "run", "index.ts"]
