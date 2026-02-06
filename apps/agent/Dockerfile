# Multi-Agent Research System - Agent Runtime Container
# Required for deployment to Amazon Bedrock AgentCore Runtime
# Platform: ARM64 (determined by CodeBuild environment, required for AgentCore Runtime)
# Using ECR Public Gallery to avoid Docker Hub rate limits

FROM public.ecr.aws/docker/library/node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY packages/infra/package.json ./packages/infra/
COPY packages/shared/package.json ./packages/shared/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/ui/package.json ./packages/ui/
COPY apps/agent/package.json ./apps/agent/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN yarn install --immutable

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/typescript-config ./packages/typescript-config
COPY apps/agent ./apps/agent

# Build
RUN yarn workspace @repo/shared build
RUN yarn workspace agent build

# Production image
FROM public.ecr.aws/docker/library/node:20-slim AS runner

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/apps/agent/dist ./apps/agent/dist
COPY --from=builder /app/apps/agent/package.json ./apps/agent/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# AgentCore Runtime requires:
# - Host: 0.0.0.0
# - Port: 8080
# - ARM64 architecture (handled by build platform)
ENV HOST=0.0.0.0
ENV PORT=8080

EXPOSE 8080

# Health check for AgentCore Runtime (uses /ping endpoint)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:8080/ping').then(r => process.exit(r.ok ? 0 : 1))"

WORKDIR /app/apps/agent

# Load OpenTelemetry instrumentation before server (AgentCore Observability)
CMD ["node", "--import", "./dist/instrument.js", "dist/server.js"]
