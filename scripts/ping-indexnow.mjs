#!/usr/bin/env node
// Notifies IndexNow-participating search engines (Bing, Yandex, and others —
// Google does not participate in IndexNow) that the site changed, so they
// recrawl sooner than their own schedule. Run after every deploy (see
// update.sh) or manually via `pnpm run indexnow`.
//
// Reads the live sitemap rather than importing src/lib/seo.ts's route list
// directly, so the pinged URLs always match exactly what's actually being
// served and this script needs no TypeScript build step.

const SITE_URL = "https://esim.uplisoft.com";
const INDEXNOW_KEY = "f0cff59a140c9ed46080afdc578bf9f7";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

async function collectSitemapUrls() {
  const indexXml = await fetchText(`${SITE_URL}/sitemap.xml`);
  const segmentUrls = extractLocs(indexXml);

  const urlLists = await Promise.all(
    segmentUrls.map(async (segmentUrl) => extractLocs(await fetchText(segmentUrl)))
  );

  return [...new Set(urlLists.flat())];
}

async function pingIndexNow(urlList) {
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(SITE_URL).hostname,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList
    })
  });

  const body = await response.text();
  return { status: response.status, body };
}

async function main() {
  const urlList = await collectSitemapUrls();
  console.log(`Pinging IndexNow with ${urlList.length} URLs...`);

  const { status, body } = await pingIndexNow(urlList);

  // IndexNow returns 200 for a new key/URL set, 202 if it has already seen
  // this key recently — both mean the ping was accepted.
  if (status !== 200 && status !== 202) {
    throw new Error(`IndexNow ping failed: ${status} ${body}`);
  }

  console.log(`IndexNow ping accepted (status ${status}).`);
}

main().catch((error) => {
  console.error("IndexNow ping failed:", error);
  process.exitCode = 1;
});
