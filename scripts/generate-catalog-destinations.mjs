#!/usr/bin/env node
/**
 * Regenerates src/content/catalog-destinations.ts: one /esim/<slug> page per
 * single-country code in the live backend catalog that has no hand-written
 * page yet. Run when the catalog gains or drops countries:
 *
 *   node scripts/generate-catalog-destinations.mjs [https://esim.uplisoft.com/api]
 *
 * Names, public slugs and sub-region groups are curated below; a country
 * missing from GROUPS fails the run so it can't ship without related links.
 */
import { writeFileSync } from "node:fs";

const api = process.argv[2] ?? "https://esim.uplisoft.com/api";
const out = new URL("../src/content/catalog-destinations.ts", import.meta.url);

/** Backend codes served by an existing hand-written page or a region page. */
const HANDLED = new Set([
  "albania", "australia", "austria", "canada", "croatia", "france", "germany", "greece", "indonesia",
  "ireland", "italy", "japan", "mexico", "netherlands", "portugal", "spain", "switzerland", "thailand",
  "turkey", "united-arab-emirates", "united-kingdom", "united-states"
]);

/** Public slug -> backend code, where the backend code reads badly in a URL. */
const SLUG_FOR_CODE = {
  macedonia: "north-macedonia",
  "palestine-state-of": "palestine",
  "puerto-rico-us": "puerto-rico",
  "saint-martinfrench-part": "saint-martin",
  "sint-maartendutch-part": "sint-maarten",
  "virgin-islands": "us-virgin-islands"
};

const NAME_FOR_CODE = {
  "antigua-and-barbuda": "Antigua and Barbuda",
  "democratic-republic-of-the-congo": "Democratic Republic of the Congo",
  "palestine-state-of": "Palestine",
  "saint-martinfrench-part": "Saint Martin",
  "sint-maartendutch-part": "Sint Maarten",
  "timor-leste": "Timor-Leste",
  "virgin-islands": "US Virgin Islands"
};

/** Names that read "in the Bahamas", not "in Bahamas". */
const WITH_ARTICLE = new Set([
  "azores", "bahamas", "british-virgin-islands", "canary-islands", "cayman-islands",
  "central-african-republic", "congo", "czech-republic", "democratic-republic-of-the-congo",
  "dominican-republic", "faroe-islands", "gambia", "isle-of-man", "maldives", "philippines",
  "seychelles", "turks-and-caicos-islands", "virgin-islands"
]);

/**
 * Sub-region -> label, regional hub page and members (public slugs, hand-written
 * pages included so they show up as neighbours).
 */
const GROUPS = {
  nordics: { label: "the Nordics", hub: "europe", members: ["denmark", "finland", "iceland", "norway", "sweden", "faroe-islands", "greenland"] },
  baltics: { label: "the Baltics", hub: "europe", members: ["estonia", "latvia", "lithuania", "finland", "poland"] },
  "british-isles": { label: "the British Isles", hub: "europe", members: ["uk", "ireland", "scotland", "isle-of-man", "jersey"] },
  iberia: { label: "Iberia", hub: "europe", members: ["spain", "portugal", "azores", "madeira", "canary-islands", "andorra", "gibraltar"] },
  "western-europe": { label: "Western Europe", hub: "europe", members: ["france", "belgium", "netherlands", "luxembourg", "monaco"] },
  "central-europe": { label: "Central Europe", hub: "europe", members: ["germany", "austria", "switzerland", "liechtenstein", "czech-republic", "slovakia", "poland", "hungary", "slovenia"] },
  mediterranean: { label: "the Mediterranean", hub: "europe", members: ["italy", "vatican-city", "malta", "cyprus", "northern-cyprus", "greece"] },
  balkans: { label: "the Balkans", hub: "europe", members: ["kosovo", "north-macedonia", "montenegro", "serbia", "bosnia-and-herzegovina", "albania", "croatia", "bulgaria", "romania"] },
  "eastern-europe": { label: "Eastern Europe", hub: "europe", members: ["ukraine", "moldova", "belarus", "romania", "poland"] },
  caucasus: { label: "the Caucasus", hub: "europe", members: ["georgia", "armenia", "azerbaijan", "turkey"] },
  "central-asia": { label: "Central Asia", hub: "asia", members: ["kazakhstan", "kyrgyzstan", "tajikistan", "uzbekistan", "mongolia", "afghanistan"] },
  "south-asia": { label: "South Asia", hub: "asia", members: ["india", "pakistan", "bangladesh", "nepal", "bhutan", "sri-lanka", "maldives"] },
  "east-asia": { label: "East Asia", hub: "asia", members: ["japan", "south-korea", "china", "hong-kong", "macao", "taiwan"] },
  "southeast-asia": { label: "Southeast Asia", hub: "asia", members: ["thailand", "vietnam", "cambodia", "laos", "malaysia", "singapore", "indonesia", "philippines", "brunei", "timor-leste"] },
  oceania: { label: "Oceania", hub: "asia", members: ["australia", "new-zealand", "fiji", "samoa", "tonga", "vanuatu", "papua-new-guinea", "nauru", "guam"] },
  "gulf-and-levant": { label: "the Middle East", hub: "middle-east", members: ["uae", "saudi-arabia", "qatar", "kuwait", "bahrain", "oman", "jordan", "israel", "palestine", "lebanon", "iraq"] },
  "north-africa": { label: "North Africa", hub: "africa", members: ["egypt", "morocco", "tunisia", "algeria"] },
  "west-africa": { label: "West Africa", hub: "africa", members: ["senegal", "gambia", "guinea", "guinea-bissau", "sierra-leone", "liberia", "cote-divoire", "ghana", "togo", "benin", "nigeria", "burkina-faso", "mali", "niger", "cape-verde"] },
  "central-africa": { label: "Central Africa", hub: "africa", members: ["cameroon", "chad", "central-african-republic", "gabon", "congo", "democratic-republic-of-the-congo"] },
  "east-africa": { label: "East Africa", hub: "africa", members: ["kenya", "tanzania", "uganda", "rwanda", "ethiopia", "madagascar", "mauritius", "seychelles", "mayotte", "reunion"] },
  "southern-africa": { label: "Southern Africa", hub: "africa", members: ["south-africa", "botswana", "zimbabwe", "zambia", "malawi", "mozambique", "lesotho", "eswatini"] },
  "central-america": { label: "Central America", hub: "south-america", members: ["mexico", "guatemala", "belize", "honduras", "el-salvador", "nicaragua", "costa-rica", "panama"] },
  caribbean: {
    label: "the Caribbean",
    hub: "north-america",
    members: [
      "bahamas", "jamaica", "haiti", "dominican-republic", "puerto-rico", "us-virgin-islands", "british-virgin-islands",
      "anguilla", "antigua-and-barbuda", "saint-kitts-and-nevis", "montserrat", "guadeloupe", "marie-galante", "dominica",
      "martinique", "saint-lucia", "saint-vincent-and-the-grenadines", "barbados", "grenada", "trinidad-and-tobago",
      "aruba", "curacao", "bonaire", "saba", "sint-eustatius", "sint-maarten", "saint-martin", "saint-barthelemy",
      "cayman-islands", "turks-and-caicos-islands", "bermuda"
    ]
  },
  "south-america": { label: "South America", hub: "south-america", members: ["brazil", "argentina", "chile", "uruguay", "paraguay", "bolivia", "peru", "ecuador", "colombia", "venezuela", "guyana", "suriname", "french-guiana"] }
};

const groupOf = new Map();
for (const [id, group] of Object.entries(GROUPS)) {
  for (const member of group.members) if (!groupOf.has(member)) groupOf.set(member, id);
}

const response = await fetch(`${api}/packages`, { headers: { Accept: "application/json" } });
if (!response.ok) throw new Error(`GET ${api}/packages -> ${response.status}`);
const payload = await response.json();
const packages = payload.data?.packages ?? payload.packages ?? [];

/** code -> single-country catalog name; multi-country (regional) codes are skipped. */
const countries = new Map();
const regional = new Set();
for (const pkg of packages) {
  const code = pkg.countryCode?.trim().toLowerCase();
  if (!code || typeof pkg.priceNumeric !== "number" || pkg.priceNumeric <= 0) continue;
  const titles = (pkg.countries ?? []).map((country) => country.title?.trim()).filter(Boolean);
  if (titles.length !== 1) regional.add(code);
  else if (!countries.has(code)) countries.set(code, titles[0]);
}

const entries = [];
const missing = [];
for (const [code, catalogName] of countries) {
  if (regional.has(code) || HANDLED.has(code)) continue;
  const slug = SLUG_FOR_CODE[code] ?? code;
  const group = groupOf.get(slug);
  if (!group) {
    missing.push(slug);
    continue;
  }
  const name = NAME_FOR_CODE[code] ?? catalogName;
  entries.push({
    slug,
    ...(slug !== code ? { backendCode: code } : {}),
    name,
    ...(name !== catalogName ? { catalogName } : {}),
    ...(WITH_ARTICLE.has(code) ? { article: true } : {}),
    group
  });
}

if (missing.length > 0) {
  throw new Error(`Add these slugs to a GROUPS entry first: ${missing.join(", ")}`);
}

entries.sort((a, b) => a.slug.localeCompare(b.slug));

const file = `// Generated by scripts/generate-catalog-destinations.mjs from ${api}/packages
// on ${new Date().toISOString().slice(0, 10)}. Edit the script, not this file.

export type CatalogDestinationGroup = {
  label: string;
  /** Regional /esim hub page this sub-region links to. */
  hub: string;
  /** Public /esim slugs, hand-written pages included. */
  members: string[];
};

export type CatalogDestination = {
  slug: string;
  /** Backend /packages countryCode, when it differs from the slug. */
  backendCode?: string;
  name: string;
  /** The name regional plan coverage lists use, when it differs from \`name\`. */
  catalogName?: string;
  /** Reads "in the Bahamas", not "in Bahamas". */
  article?: true;
  group: string;
};

export const catalogDestinationGroups: Record<string, CatalogDestinationGroup> = ${JSON.stringify(GROUPS, null, 2)};

export const catalogDestinations: CatalogDestination[] = ${JSON.stringify(entries, null, 2)};
`;

writeFileSync(out, file);
console.log(`Wrote ${entries.length} catalog destinations to ${out.pathname}`);
