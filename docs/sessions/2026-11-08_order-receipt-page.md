# 2026-11-08 · Order receipt page

**Goal:** give the receipt QR code a destination and let buyers download their receipt.

**Done**
- `/orders/[code]`: sign-in gate; buyer → `/account/{id}`; backend-allowed others (admin, gift buyer) → download card; else 404.
- `/bff/orders/[code]/receipt` proxies the PDF.
- "Download receipt" button on `/account/[orderId]`.

**Follow-up:** hide the button for gift recipients (needs a backend flag on the order).
