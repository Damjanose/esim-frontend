---
date: 2026-09-10
tags: [admin, sockets]
status: complete
---

# Session: support-typing

## What existed before
The inbox sent live messages but not a composing signal.

## What was done
Emit `support:typing` while the reply draft is non-empty, stop after 1.5s idle, on send, and when leaving the thread.

## Outcome
Travelers in the app can show typing, then the sent message. Needs the backend typing relay deployed.
