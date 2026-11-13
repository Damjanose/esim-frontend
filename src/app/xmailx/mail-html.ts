/**
 * Pure helpers for rendering a sanitized mail body inside a sandboxed iframe.
 * No DOM access: the backend has already sanitized the html and rewritten remote
 * images to `data-remote-src`, so these functions only move that marker around.
 */

const IMG_TAG = /<img\b[^>]*>/gi;
const REMOTE_SRC_ATTR = /\sdata-remote-src\s*=\s*(?:"([^"]*)"|'([^']*)')/i;
const EXISTING_SRC_ATTR = /\ssrc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i;

/** Puts `data-remote-src` back into `src` on every image that still carries it. */
export function restoreRemoteImages(html: string): string {
  return html.replace(IMG_TAG, (tag) => {
    const match = REMOTE_SRC_ATTR.exec(tag);
    if (!match) return tag;
    const url = (match[1] ?? match[2] ?? "").replace(/"/g, "&quot;");
    const withoutMarker = tag.replace(match[0], "").replace(EXISTING_SRC_ATTR, "");
    return withoutMarker.replace(/^<img/i, `<img src="${url}"`);
  });
}

/** True when the body has remote images that are still blocked. */
export function hasBlockedRemoteImages(html: string): boolean {
  return /\sdata-remote-src\s*=/i.test(html);
}

/**
 * Full document for the iframe `srcDoc`. The CSP blocks everything except inline
 * styles and data/cid images; `allowRemote` adds https images for one message only.
 */
export function buildSrcDoc(html: string, allowRemote: boolean): string {
  const body = allowRemote ? restoreRemoteImages(html) : html;
  const imgSources = allowRemote ? "data: cid: https:" : "data: cid:";
  const csp = `default-src 'none'; img-src ${imgSources}; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'`;

  return [
    "<!doctype html>",
    '<html><head><meta charset="utf-8">',
    '<meta name="referrer" content="no-referrer">',
    `<meta http-equiv="Content-Security-Policy" content="${csp}">`,
    "<style>",
    "body{margin:0;padding:16px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.5;color:#0b1220;word-wrap:break-word;overflow-wrap:anywhere}",
    "img{max-width:100%;height:auto}",
    "</style></head>",
    `<body>${body}</body></html>`
  ].join("");
}
