# kiro-e2e

Playwright E2E test suite for [kiro-app](https://github.com/enageshwari/kiro-app).
Runs against a live deployed instance of the app on AWS Fargate, triggered automatically
by the kiro-app CI pipeline on every push to `main`.

---

## Full System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GitHub                                       │
│                                                                      │
│  kiro-app (push to main)          kiro-e2e (push to main)           │
│       │                                  │                           │
│  GHA Workflow                       GHA Workflow                     │
│  1. vitest unit tests               1. docker build                  │
│  2. docker build + ECR push         2. push to ECR (kiro-e2e:latest) │
│  3. aws ecs update-service          └──────────────────────────────┘ │
│  4. POST /run-e2e (webhook)                                          │
│       │                                                              │
└───────┼──────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────┐
│   API Gateway     │  POST /run-e2e  (protected by API key)
│   (us-east-1)     │  Returns 202 immediately
└────────┬──────────┘
         │  async invoke
         ▼
┌───────────────────┐
│ Lambda            │  kiro-trigger-e2e
│ (Node 20, 15 min) │  - calls ECS RunTask
│                   │  - polls ECS until task STOPPED
│                   │  - writes result to CloudWatch
└────────┬──────────┘
         │  RunTask
         ▼
┌───────────────────────────────────────────────────────┐
│  AWS Fargate (kiro-cluster, us-east-1)                │
│                                                       │
│  Task: kiro-e2e  (2 vCPU, 2GB RAM)                   │
│  Image: ECR kiro-e2e:latest                           │
│  CMD: npx playwright test --reporter=line             │
│                                                       │
│  Runs against APP_URL (injected at runtime by Lambda) │
│  stdout/stderr ──► CloudWatch /ecs/kiro-e2e           │
│  exit 0 = PASSED, non-zero = FAILED                   │
└────────┬──────────────────────────────────────────────┘
         │
         ▼
┌───────────────────────────────────────────┐
│  CloudWatch Logs                          │
│  /ecs/kiro-e2e                            │
│  ├── playwright/*        (test output)    │
│  └── e2e-results/<runId> (pass/fail JSON) │
└────────┬──────────────────────────────────┘
         │  GHA polls every 30s (max 15 min)
         ▼
┌───────────────────────────────────────────┐
│  GHA: Poll CloudWatch for E2E result      │
│  { result: "PASSED" | "FAILED" }          │
│  Pass/fail gates the kiro-app workflow    │
└───────────────────────────────────────────┘
```

---

## Test suites

| File | Type | What it covers |
|---|---|---|
| `kiro-app.spec.ts` | UI / E2E | User interactions: input, submit, greeting, edge cases |
| `api.spec.ts` | API integration | HTTP status codes, content type, health endpoint |
| `accessibility.spec.ts` | Accessibility | WCAG 2.1 AA via axe-core (initial load, post-interaction, focus) |
| `mobile.spec.ts` | Mobile E2E | Pixel 5 and iPhone 12 viewport emulation, tap interactions |

Playwright projects configured:
- `chromium` — Desktop Chrome (all tests except mobile)
- `firefox` — Desktop Firefox (UI + API, no visual/mobile)
- `Mobile Chrome - Pixel 5` — Mobile emulation
- `Mobile Chrome - iPhone 12` — Mobile emulation

---

## Local development

### Prerequisites
- Node.js 20+
- kiro-app running locally or pointing to a deployed URL

### Setup

```bash
# 1. Clone this repo
git clone https://github.com/enageshwari/kiro-e2e
cd kiro-e2e

# 2. Install dependencies
npm install

# 3. Install Playwright browser binaries (one-time, ~300MB)
npx playwright install

# 4. Start kiro-app locally (in a separate terminal, from kiro-app repo)
npm run dev   # starts at http://localhost:3000

# 5. Run tests (default APP_URL is http://localhost:3000)
npm test

# Run against a deployed environment
APP_URL=http://your-alb-url.elb.amazonaws.com npm test

# Run a specific test file
npx playwright test tests/api.spec.ts

# Run with headed browser (visible)
npx playwright test --headed

# Show HTML report after run
npx playwright show-report
```

---

## CI/CD — runner image

The `Dockerfile` in this repo builds the Playwright runner image.
GHA pushes it to ECR on every push to `main`.

```bash
# Build locally
docker build -t kiro-e2e:local .

# Run locally against a deployed app
docker run -e APP_URL=http://your-alb-url.com kiro-e2e:local
```

### GitHub Actions secrets required

| Secret | Value | Where to get it |
|---|---|---|
| `AWS_ROLE_ARN` | `arn:aws:iam::<account>:role/kiro-e2e-gha-role` | `KiroGitHubOidcStack` CDK output |
| `ECR_REPOSITORY_E2E` | `<account>.dkr.ecr.us-east-1.amazonaws.com/kiro-e2e` | `KiroE2EPipelineStack` CDK output |

---

## Debugging

### Check if Playwright tests passed/failed on Fargate

```bash
# View live Playwright output from the Fargate task
aws logs tail /ecs/kiro-e2e --log-stream-name-prefix playwright --follow

# View the structured result written by Lambda
aws logs get-log-events \
  --log-group-name /ecs/kiro-e2e \
  --log-stream-name "e2e-results/<github-run-id>" \
  --query 'events[*].message' \
  --output text | jq .
```

### Check ECS task status

```bash
# List recent tasks in the cluster
aws ecs list-tasks --cluster kiro-cluster

# Describe a specific task
aws ecs describe-tasks \
  --cluster kiro-cluster \
  --tasks <task-arn> \
  --query 'tasks[0].{status:lastStatus,exitCode:containers[0].exitCode,reason:stoppedReason}'
```

### Re-trigger E2E manually (without pushing to kiro-app)

```bash
# Invoke the Lambda trigger directly
aws lambda invoke \
  --function-name kiro-trigger-e2e \
  --invocation-type RequestResponse \
  --payload '{"appUrl":"http://your-alb-url.com","runId":"manual-test","commitSha":"local"}' \
  --cli-binary-format raw-in-base64-out \
  /tmp/result.json && cat /tmp/result.json | jq .
```

### Check ECR image exists before triggering

```bash
aws ecr list-images --repository-name kiro-e2e --query 'imageIds[*].imageTag' --output table
```

---

## Known issues & callouts

### Fargate task timeout
The Lambda polls ECS for up to 14 minutes. On first run (cold start), the Fargate
task may take longer because:
- The `kiro-e2e` image is large (~1.5GB with browser binaries)
- Fargate pulls the image from ECR before starting — this can take 2-4 minutes on cold start
- Playwright runs 4 browser projects in parallel (chromium, firefox, pixel 5, iphone 12)

**Fix options:**
1. Increase Lambda timeout beyond 15 min and use Step Functions for orchestration
2. Reduce test parallelism — run chromium only in CI (`--project=chromium`)
3. Pre-warm by running a lightweight smoke test first

### E2E runs on every kiro-app push
If you want E2E to run only on specific branches or tags, update the `trigger-e2e`
job condition in `kiro-app/.github/workflows/ci.yml`.

### Image not found error
If Fargate fails with `CannotPullContainerError: kiro-e2e:latest not found`:
1. Check the `kiro-e2e` GHA workflow ran successfully
2. Verify the image exists: `aws ecr list-images --repository-name kiro-e2e`
3. The Fargate task execution role needs `ecr:GetAuthorizationToken` and `ecr:BatchGetImage` — these are granted by the CDK stack

### APP_URL not reachable from Fargate
The Fargate task runs in private subnets. The `APP_URL` must be the public ALB DNS,
not `localhost`. The Lambda injects `APP_URL` from the webhook payload sent by kiro-app GHA.

### OIDC auth fails on first push
The OIDC IAM roles (`kiro-app-gha-role`, `kiro-e2e-gha-role`) must be deployed via
`kiro-infra` **before** the first GHA run. If a workflow runs before the role exists,
re-trigger it with an empty commit:
```bash
git commit --allow-empty -m "ci: retrigger after OIDC role deployed"
git push
```
