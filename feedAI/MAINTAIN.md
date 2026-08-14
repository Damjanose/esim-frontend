# Maintaining feedAI

Read this only when updating feedAI itself.

## The one rule

Never delete knowledge without a facts.jsonl line. Topic files are a summary and may be
trimmed freely; facts.jsonl is append-only and is the actual memory.

## Budgets

| Item | Budget |
| --- | --- |
| brain.json | ≤10KB / ~2.5k tok |
| each topics/*.json | ≤10KB / ~2.5k tok |
| fixed_in_brain (recent ids) | ≤20 recent ids — full history via `grep facts.jsonl` |

## After any change that alters how the system works

1. Append a facts.jsonl line. Keep `id` monotonic (f032, f033, ...). Pick the right `kind`
   (`measured`|`decision`|`constraint`|`risk`|`open`|`state`|`fix`). Every fact needs a real
   `source` (file path, commit, or command) — no source, don't write it (or mark clearly
   inferred).
2. Edit the affected `topics/*.json` so it matches.
3. If it's a diagnosed bug, add an entry to `topics/troubleshooting.json`'s `entries` array
   (symptom / root_cause / fix / facts / source).
4. Update `brain.json -> sync` (commit, date, note_latest) and `phase` if it moved.
5. If an invariant was added, broken, or retired, update `brain.json -> invariants`.
6. If a new topic file was created or an existing one's scope changed, update
   `index.json -> topics` and `brain.json -> route` together — they must describe the same
   topic set.

## Correcting a wrong fact

Do not edit or delete the old line. Append a new one with `"supersedes":"f0NN"`.

## What must never enter feedAI

- Nothing from `.env.local` or `.env.production` values — only the *variable names* and what
  they gate, never the actual client id / services id / secret strings. Specifically:
  `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `NEXT_PUBLIC_APPLE_SERVICES_ID`, `BACKEND_API_URL`,
  `NEXT_PUBLIC_API_URL`, `PUBLIC_SITE_ORIGIN`.
- No backend secrets even by reference to the sibling repo: `GOOGLE_WEB_CLIENT_ID`,
  `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `APPLE_BUNDLE_ID`,
  `APPLE_SERVICES_ID`, `JWT_SECRET`, `ESIM_PROVIDER_URL`/`ESIM_PROVIDER_KEY` — name the env
  var, never paste its value.
- No admin credentials for `/xloginy`, no Pokpay API keys, no session cookie values, no real
  user emails/PII, no access/refresh tokens (even expired ones — token *shape* is fine to
  document, e.g. `dev-auth.<payload>.<hmac>`, an actual token string is not).
- Before finishing any edit, grep your own diff for things that look like a credential
  (long random strings, `sk-`, `.apps.googleusercontent.com` with a real id, PEM headers)
  before considering the change done.
