---
date: 2026-09-15
tags: [config, docs]
status: complete
---

# Session: production environment switch

## What existed before
The local web environment pointed BFF calls and support sockets at the local backend.

## What was done
- Set `BACKEND_API_URL` to `https://esim.uplisoft.com/api` in local and production web env files.
- Set `NEXT_PUBLIC_SOCKET_URL` to `https://esim.uplisoft.com`.

## Outcome
The web app now uses the production API and Socket.IO origin in local and production builds.
