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
// Yandex accepts this host's key file. api.indexnow.org is Bing's gateway and
// returns 403 UserForbiddedToAccessSite when the Bing Webmaster property was
// imported from Google Search Console instead of verified on its own.
const INDEXNOW_ENDPOINTS = ["https://yandex.com/indexnow", "https://api.indexnow.org/indexnow"];

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

function isAccepted(status) {
  // 200 is a new submission. 202 means the engine already has this key.
  return status === 200 || status === 202;
}

async function pingIndexNow(endpoint, urlList) {
  const response = await fetch(endpoint, {
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
  return { endpoint, status: response.status, body };
}

async function main() {
  const urlList = await collectSitemapUrls();
  console.log(`Pinging IndexNow with ${urlList.length} URLs...`);

  const results = [];
  for (const endpoint of INDEXNOW_ENDPOINTS) {
    const result = await pingIndexNow(endpoint, urlList);
    results.push(result);
    console.log(`${endpoint} -> ${result.status}`);
  }

  const bingRefusal = results.find((result) => result.body.includes("UserForbiddedToAccessSite"));
  if (bingRefusal) {
    console.error(
      "Bing refused this IndexNow key. The key file is already public at " +
        `${SITE_URL}/${INDEXNOW_KEY}.txt. In Bing Webmaster Tools, remove the ` +
        "Google Search Console import for esim.uplisoft.com and verify the site " +
        "with Bing's own XML file, then run pnpm run indexnow again."
    );
  }

  const accepted = results.filter((result) => isAccepted(result.status));
  if (accepted.length === 0) {
    throw new Error(
      `IndexNow ping failed: ${results.map((result) => `${result.status} ${result.body}`).join(" | ")}`
    );
  }

  console.log(`IndexNow ping accepted by ${accepted.map((result) => result.endpoint).join(", ")}.`);
}

main().catch((error) => {
  console.error("IndexNow ping failed:", error);
  process.exitCode = 1;
});
