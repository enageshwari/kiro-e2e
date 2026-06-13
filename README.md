# kiro-e2e

Playwright E2E test suite for kiro-app. Runs against a deployed instance of the app.

## Repos in this system

| Repo | Purpose |
|---|---|
| **kiro-app** | App source — triggers E2E pipeline on every push to main |
| **kiro-e2e** (this repo) | Playwright tests and runner Dockerfile |
| **kiro-infra** | AWS CDK infrastructure (private — contains account-specific config) |

## Test suites

| File | Type | What it tests |
|---|---|---|
| `kiro-app.spec.ts` | UI / E2E | User interactions (input, submit, greeting) |
| `api.spec.ts` | API integration | HTTP responses from the Express server |
| `accessibility.spec.ts` | Accessibility | WCAG 2.1 AA via axe-core |
| `mobile.spec.ts` | Mobile E2E | Pixel 5 and iPhone 12 viewport emulation |

## Running locally

Start the app first (default `http://localhost:3000`):

```bash
# in kiro-app repo:
npm run dev
```

Then in this repo:

```bash
npm install
npx playwright install   # download browser binaries (one-time)
npm test                 # runs against APP_URL (default: http://localhost:3000)
```

To run against a deployed environment:
```bash
APP_URL=http://your-alb-url.elb.amazonaws.com npm test
```

## CI/CD — runner image

GHA builds and pushes the Playwright runner Docker image to ECR on every push to `main`.
The image is used by AWS Fargate (triggered by kiro-app CI) to run the full test suite.

## GitHub Actions secrets required

| Secret | Description |
|---|---|
| `AWS_ROLE_ARN` | IAM role ARN for OIDC authentication (from kiro-infra deploy output) |
| `ECR_REPOSITORY_E2E` | ECR URI for the runner image (from kiro-infra deploy output) |

> **No AWS access keys are stored.** Uses OIDC — see kiro-infra README.
