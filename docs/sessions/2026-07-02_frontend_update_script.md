---
date: 2026-07-02
tags: [deployment, scripts]
status: complete
---

# Session: frontend-update-script

## What existed before

The production frontend was deployed at `/var/www/esim-frontend` and served by `esim-frontend.service`, but future deployments required a manual sequence of `git pull`, dependency install, build, service restart, and route checks.

## What was done

- Added `update.sh` for the production frontend checkout.
- The script configures the frontend deploy key if present, fast-forwards Git, installs dependencies with `pnpm install --frozen-lockfile`, builds with `pnpm build`, restarts `esim-frontend`, waits for local readiness on `127.0.0.1:3020`, and verifies the public frontend, health, and API URLs.

## Outcome

Future frontend deploys can run:

```bash
cd /var/www/esim-frontend
./update.sh
```

The script keeps `/` deployed through the frontend while confirming `/api` and `/health` still reach the backend.
