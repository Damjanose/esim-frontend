---
date: 2026-09-09
tags: [api, public-content-pages, ui-components-styling]
status: complete
---

# Session: coverage-aware-filters

## What existed before
The web catalog searched only each package's own country or pseudo-region. A real country such as Japan could therefore omit regional/global plans that covered it, and selecting a bundle from search could open the bundle destination instead of Japan.

## What was done
- Added canonical coverage metadata to the shared package mapping.
- Made hero search and destination browse expose real countries represented only through regional/global coverage.
- Made destination plan selection include local and covering regional/global packages.
- Preserved URL-backed wizard filters across the expanded candidate set.
- Added package-service regression coverage for country name and ISO matching.

## How it was done
The existing BFF boundary and backend-curated rails remain unchanged. Client mapping helpers provide normalized matching and virtual country options while preserving regional/global pseudo-destinations as direct destinations.

## Outcome
Searching or selecting Japan now routes to Japan and shows matching local and covering bundle plans, while aliases and ISO codes remain searchable and existing plan filters continue to apply.
