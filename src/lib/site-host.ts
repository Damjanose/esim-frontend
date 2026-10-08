/**
 * The one public host the site is indexed and linked under.
 *
 * The brand is eSim2you but the site lives on esim.uplisoft.com, so visitors
 * who type or search the brand land on unrelated domains (esim2you.com is a
 * registrar placeholder, esim2me.com is a competitor). Moving to a brand
 * domain is a config change: point its DNS at the server, then set
 * NEXT_PUBLIC_SITE_HOST and rebuild. The old host joins the alias list and
 * 308s to the new one. See docs/runbooks/brand-domain-migration.md.
 */
const DEFAULT_SITE_HOST = "esim.uplisoft.com";

/** Brand-name domains to fold into the canonical host whenever they reach us. */
const BRAND_ALIAS_HOSTS = ["esim2you.com"];

export function normalizeHost(value: string | undefined | null): string | null {
  const host = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[/:].*$/, "")
    .replace(/\.$/, "");
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ? host : null;
}

function withWww(host: string): string[] {
  const bare = host.replace(/^www\./, "");
  return [bare, `www.${bare}`];
}

export function resolveSiteHosts(env: {
  siteHost?: string;
  aliasHosts?: string;
}): { canonicalHost: string; aliasHosts: string[] } {
  const canonicalHost = normalizeHost(env.siteHost) ?? DEFAULT_SITE_HOST;
  const extra = (env.aliasHosts ?? "")
    .split(",")
    .map(normalizeHost)
    .filter((host): host is string => host !== null);

  const aliases = new Set(
    [DEFAULT_SITE_HOST, ...BRAND_ALIAS_HOSTS, ...extra, canonicalHost].flatMap(withWww)
  );
  aliases.delete(canonicalHost);

  return { canonicalHost, aliasHosts: [...aliases].sort() };
}

const resolved = resolveSiteHosts({
  siteHost: process.env.NEXT_PUBLIC_SITE_HOST,
  aliasHosts: process.env.NEXT_PUBLIC_SITE_ALIAS_HOSTS
});

export const canonicalHost = resolved.canonicalHost;
/** Every host (bare and www) that should 308 to `canonicalHost`. */
export const aliasHosts: readonly string[] = resolved.aliasHosts;
export const siteUrl = `https://${canonicalHost}`;
