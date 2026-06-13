# Playwright runner image — used by Fargate to run E2E tests
# ~1.5GB due to browser binaries; never deployed to production
FROM mcr.microsoft.com/playwright:v1.60.0-jammy

WORKDIR /e2e

# Install dependencies (cached layer)
COPY package*.json ./
RUN npm ci

# Copy test code and config
COPY . .

# APP_URL is injected at runtime by Lambda via ECS container override.
# Defaults to localhost for local runs.
ENV APP_URL=http://localhost:3000
ENV CI=true

# Exit code mirrors Playwright pass/fail.
# Lambda reads the ECS task exit code to determine PASSED or FAILED.
CMD ["npx", "playwright", "test", "--reporter=line"]
