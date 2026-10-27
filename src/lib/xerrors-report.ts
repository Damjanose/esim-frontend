import { siteUrl } from "./site-host";
import type { ProvisioningClaim } from "./xerrors-claim";

export type AdminApiCall = {
  method?: string | null;
  url?: string | null;
  path?: string | null;
  headers?: unknown;
  body?: unknown;
  status?: number | null;
  response?: unknown;
  requestId?: string | null;
  durationMs?: number | null;
};

export type AdminErrorEvent = {
  id: string;
  requestId: string;
  userEmail: string | null;
  method: string;
  path: string;
  statusCode: number;
  severity: string;
  area: string;
  message: string;
  internalCode: string | null;
  /** Only present on GET /errors/:id; the list returns `hasAuthorization` instead. */
  authorizationHeader?: string | null;
  hasAuthorization?: boolean;
  /** List rows carry these flags instead of apiCalls/stack; the detail record has the full values. */
  hasApiCalls?: boolean;
  apiCallCount?: number;
  hasStack?: boolean;
  originalRequestBody: unknown;
  safeRequestBody: unknown;
  safeQuery: unknown;
  providerName: string | null;
  providerStatusCode: number | null;
  providerMessage: string | null;
  providerEndpoint: string | null;
  relatedOrderId: string | null;
  relatedPaymentReference: string | null;
  relatedPackageId: string | null;
  relatedIccid: string | null;
  repairAction: string | null;
  backendResponse: unknown;
  resolvedAt: string | null;
  resolvedBy: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  source?: string | null;
  kind?: string | null;
  appVersion?: string | null;
  appBuild?: string | null;
  platform?: string | null;
  osVersion?: string | null;
  deviceModel?: string | null;
  deviceId?: string | null;
  userAgent?: string | null;
  screen?: string | null;
  scenario?: string | null;
  stage?: string | null;
  stack?: string | null;
  errorName?: string | null;
  apiCalls?: AdminApiCall[] | null;
  clientContext?: unknown;
  /** Detail record only: the payment's provisioning claim, when one exists. */
  claim?: ProvisioningClaim | null;
  userEmailSource?: string | null;
  noEmailReason?: string | null;
  clientIp?: string | null;
  clientIpSource?: string | null;
};

/**
 * The PUBLIC backend API base (`https://<site host>/api`), which is what nginx
 * serves and what a support engineer can replay from anywhere. Deliberately not
 * getBackendApiUrl(): that may be an internal address (127.0.0.1) in production,
 * and importing it would pull the server-only backend module into this client page.
 */
export function publicApiBase(): string {
  return `${siteUrl}/api`;
}

const REQUEST_ID_PATTERN = /^[A-Za-z0-9_.:-]{8,100}$/;

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function stringifyJson(value: unknown): string {
  if (value == null) return "N/A";
  return JSON.stringify(value, null, 2);
}

function authorizationLine(event: AdminErrorEvent): string {
  const raw = event.authorizationHeader?.trim();
  if (!raw) return "Authorization: Bearer <user-token>";
  if (/^bearer\s+/i.test(raw)) return `Authorization: ${raw}`;
  return `Authorization: Bearer ${raw}`;
}

function buildUrl(event: AdminErrorEvent): string {
  const path = event.path.startsWith("/api/") || event.path === "/api" ? event.path.slice(4) : event.path;
  let url = `${publicApiBase()}${path.startsWith("/") ? path : `/${path}`}`;
  const query = event.safeQuery;
  if (!url.includes("?") && query && typeof query === "object" && !Array.isArray(query)) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
      if (value == null) continue;
      params.set(key, typeof value === "string" ? value : JSON.stringify(value));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  return url;
}

/** Replay command against the public API: real stored token, stored client headers, original body. */
export function buildBackendCurl(event: AdminErrorEvent): string {
  // Reporter-supplied: anything that is not a plain verb becomes GET, and the verb is quoted anyway.
  const rawMethod = String(event.method ?? "").toUpperCase();
  const method = /^[A-Z]{3,7}$/.test(rawMethod) ? rawMethod : "GET";
  const body = event.originalRequestBody ?? event.safeRequestBody ?? null;
  const hasBody = body != null && method !== "GET" && method !== "HEAD";

  const headers: string[] = [];
  if (hasBody) headers.push("Content-Type: application/json");
  headers.push(authorizationLine(event));
  if (event.platform && event.platform !== "unknown") headers.push(`x-platform: ${event.platform}`);
  if (event.appVersion) headers.push(`x-app-version: ${event.appVersion}`);
  if (event.appBuild) headers.push(`x-app-build: ${event.appBuild}`);
  if (event.deviceId) headers.push(`x-device-id: ${event.deviceId}`);
  if (event.requestId && REQUEST_ID_PATTERN.test(event.requestId)) headers.push(`x-request-id: ${event.requestId}`);

  const lines = [`curl -X ${shellQuote(method)} ${shellQuote(buildUrl(event))}`, ...headers.map((h) => `  -H ${shellQuote(h)}`)];
  if (hasBody) lines.push(`  --data ${shellQuote(JSON.stringify(body))}`);
  return lines.join(" \\\n");
}

/** Hint-only sources must never be presented as verified identity. */
export function describeEmailSource(source: string | null | undefined): { label: string; unverified: boolean } {
  if (source === "verified_token") return { label: "verified", unverified: false };
  if (source === "token_unverified" || source === "client_header" || source === "body") {
    return { label: "unverified", unverified: true };
  }
  if (source === "payment_lookup" || source === "device_history") {
    return { label: source.replace("_", " "), unverified: true };
  }
  return { label: "", unverified: false };
}

function line(label: string, value: unknown): string {
  const text = value == null || value === "" ? "N/A" : String(value);
  return `- **${label}:** ${text}`;
}

function fence(value: string, lang = ""): string {
  return `\`\`\`${lang}\n${value}\n\`\`\``;
}

function describeCall(call: AdminApiCall, index: number): string {
  const target = call.url ?? call.path ?? "";
  const parts = [`${index + 1}. ${call.method ?? "?"} ${target}`.trim(), `status ${call.status ?? "N/A"}`];
  if (call.durationMs != null) parts.push(`${call.durationMs}ms`);
  if (call.requestId) parts.push(`req ${call.requestId}`);
  return parts.join(" | ");
}

/** Markdown for pasting into a ticket or chat. Contains the stored token via the cURL: admin eyes only. */
export function buildFullReport(event: AdminErrorEvent): string {
  const emailSource = event.userEmail
    ? `${event.userEmailSource ?? "unknown"}${describeEmailSource(event.userEmailSource).unverified ? " (hint only)" : ""}`
    : `no email (${event.noEmailReason ?? "unknown"})`;

  const sections: string[] = [
    `# Error report ${event.id}`,
    "",
    "## User",
    line("Email", event.userEmail),
    line("Email source / reason", emailSource),
    "",
    "## Client",
    line("Source", event.source),
    line("Kind", event.kind),
    line("Platform", event.platform),
    line("App version", [event.appVersion, event.appBuild ? `(${event.appBuild})` : ""].filter(Boolean).join(" ")),
    line("OS", event.osVersion),
    line("Device model", event.deviceModel),
    line("Device id", event.deviceId),
    line("User agent", event.userAgent),
    line("IP", [event.clientIp, event.clientIpSource ? `(${event.clientIpSource})` : ""].filter(Boolean).join(" ")),
    "",
    "## Flow",
    line("Screen", event.screen),
    line("Scenario", event.scenario),
    line("Stage", event.stage),
    line("Area", event.area),
    line("Payment", event.relatedPaymentReference),
    line("Order", event.relatedOrderId),
    line("Package", event.relatedPackageId),
    line("ICCID", event.relatedIccid),
    "",
    "## Request",
    line("Request id", event.requestId),
    line("API", `${event.method} ${event.path}`),
    line("Status", event.statusCode),
    line("Severity", event.severity),
    line("Created", event.createdAt),
    line("Resolved", event.resolvedAt ?? "open"),
    line("Message", event.message),
    "",
    "### Request payload",
    fence(stringifyJson(event.originalRequestBody ?? event.safeRequestBody), "json"),
    "",
    "### Backend response",
    fence(stringifyJson(event.backendResponse), "json")
  ];

  if (event.apiCalls?.length) {
    sections.push("", "### API call trail", ...event.apiCalls.map(describeCall));
  }
  if (event.stack) {
    sections.push("", "### Stack", fence(event.stack));
  }
  sections.push("", "### cURL", fence(buildBackendCurl(event), "bash"));
  return sections.join("\n");
}
