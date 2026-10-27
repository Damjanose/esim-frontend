"use client";

import { useEffect, useState } from "react";
import { buildClaimRequest, claimGuards, type ClaimRequestInput } from "@/lib/xerrors-claim";
import {
  buildBackendCurl,
  buildFullReport,
  describeEmailSource,
  type AdminApiCall,
  type AdminErrorEvent
} from "@/lib/xerrors-report";

const PRE = "mt-1 max-h-40 overflow-auto rounded-xl bg-[#f8fdfe] p-2.5 text-xs text-midnight";
const HEADING = "text-xs font-black uppercase tracking-wide text-muted";
const GHOST_BTN =
  "rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-midnight transition hover:border-cyan disabled:opacity-50";

export function stringifyJson(value: unknown) {
  if (value == null) return "N/A";
  return JSON.stringify(value, null, 2);
}

/** Prefer the stored JSON body; for older rows fall back to the message field. */
export function displayBackendResponse(error: Pick<AdminErrorEvent, "backendResponse" | "message" | "statusCode">) {
  if (error.backendResponse != null) return stringifyJson(error.backendResponse);
  if (error.message?.trim()) {
    return stringifyJson({
      status: "error",
      message: error.message,
      statusCode: error.statusCode,
      _note: "Reconstructed from message — full response body was not stored for this event"
    });
  }
  return "N/A";
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="font-bold text-muted">{label}</dt>
      <dd className="break-words text-midnight">{children ?? "N/A"}</dd>
    </>
  );
}

function ApiCallItem({ call, index }: { call: AdminApiCall; index: number }) {
  return (
    <details className="rounded-xl border border-line bg-[#f8fdfe] p-2.5">
      <summary className="cursor-pointer font-mono text-xs text-midnight">
        {index + 1}. {call.method ?? "?"} {call.path ?? call.url ?? ""} ·{" "}
        <span className={(call.status ?? 0) >= 400 || !call.status ? "font-bold text-red-700" : "text-muted"}>
          {call.status ?? "no status"}
        </span>
        {call.durationMs != null ? ` · ${call.durationMs}ms` : ""}
      </summary>
      <dl className="mt-2 grid grid-cols-[90px_1fr] gap-1 text-xs">
        <Row label="URL">{call.url}</Row>
        <Row label="Request ID">{call.requestId}</Row>
      </dl>
      <p className={`${HEADING} mt-2`}>Headers</p>
      <pre className={PRE}>{stringifyJson(call.headers)}</pre>
      <p className={`${HEADING} mt-2`}>Body</p>
      <pre className={PRE}>{stringifyJson(call.body)}</pre>
      <p className={`${HEADING} mt-2`}>Response</p>
      <pre className={PRE}>{stringifyJson(call.response)}</pre>
    </details>
  );
}

function ClaimSection({
  event,
  isMutating,
  onClaim
}: {
  event: AdminErrorEvent;
  isMutating: boolean;
  onClaim: (body: Record<string, unknown>) => void;
}) {
  const claim = event.claim;
  const [orderId, setOrderId] = useState("");
  const [resultText, setResultText] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [formError, setFormError] = useState("");
  useEffect(() => {
    setOrderId("");
    setResultText("");
    setConfirmed(false);
    setFormError("");
  }, [event.id]);
  if (!claim) return null;

  const guards = claimGuards(claim);
  const paymentId = event.relatedPaymentReference ?? "<paymentId>";

  const submit = (input: ClaimRequestInput) => {
    const built = buildClaimRequest(input);
    if (!built.ok) {
      setFormError(built.message);
      return;
    }
    setFormError("");
    onClaim(built.body);
  };

  const Why = ({ reason }: { reason?: string }) =>
    reason ? <p className="mt-1 text-[11px] font-semibold text-muted">{reason}</p> : null;

  return (
    <div className="rounded-xl border border-line bg-[#f8fdfe] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className={HEADING}>Provisioning claim</p>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
            guards.needsReview ? "border-red-200 bg-red-50 text-red-700" : "border-line bg-white text-midnight"
          }`}
        >
          {claim.status}
          {guards.needsReview ? " · needs review" : ""}
        </span>
      </div>
      <dl className="mt-2 grid grid-cols-[130px_1fr] gap-2 text-sm">
        <Row label="Kind">{claim.kind}</Row>
        <Row label="Provider order">
          <span className="font-mono text-xs">{claim.providerOrderId}</span>
        </Row>
        <Row label="Attempts">{claim.attempts}</Row>
        <Row label="Last error">{claim.lastError}</Row>
        <Row label="Updated">{claim.updatedAt}</Row>
      </dl>
      <p className="mt-2 text-[11px] font-semibold text-muted">
        Find the order in Airalo by description containing {paymentId}. If it exists, attach its id; if not, mark
        safe to retry. Then press Run repair.
      </p>

      {claim.kind === "order" ? (
        <div className="mt-3">
          <label className="text-xs font-bold text-muted">
            Airalo order id
            <input
              className="mt-1 h-9 w-full rounded-xl border border-line px-2.5 text-sm font-normal text-midnight outline-none focus:border-cyan"
              disabled={!guards.attachOrder.enabled}
              onChange={(e) => setOrderId(e.target.value)}
              value={orderId}
            />
          </label>
          <button
            className={`${GHOST_BTN} mt-2`}
            disabled={isMutating || !guards.attachOrder.enabled}
            onClick={() => submit({ action: "attach_provider_order", airaloOrderId: orderId })}
            type="button"
          >
            Attach Airalo order id
          </button>
          <Why reason={guards.attachOrder.reason} />
        </div>
      ) : (
        <div className="mt-3">
          <label className="text-xs font-bold text-muted">
            Provider result (JSON object)
            <textarea
              className="mt-1 min-h-20 w-full rounded-xl border border-line p-2.5 font-mono text-xs font-normal text-midnight outline-none focus:border-cyan"
              disabled={!guards.attachResult.enabled}
              onChange={(e) => setResultText(e.target.value)}
              value={resultText}
            />
          </label>
          <button
            className={`${GHOST_BTN} mt-2`}
            disabled={isMutating || !guards.attachResult.enabled}
            onClick={() => submit({ action: "attach_provider_result", providerResultText: resultText })}
            type="button"
          >
            Attach provider result
          </button>
          <Why reason={guards.attachResult.reason} />
        </div>
      )}

      <div className="mt-3">
        <label className="flex items-center gap-2 text-xs font-bold text-midnight">
          <input
            checked={confirmed}
            disabled={!guards.markSafe.enabled}
            onChange={(e) => setConfirmed(e.target.checked)}
            type="checkbox"
          />
          I checked Airalo and no order exists
        </label>
        <button
          className="mt-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-700 transition hover:border-red-400 disabled:opacity-50"
          disabled={isMutating || !guards.markSafe.enabled || !confirmed}
          onClick={() => submit({ action: "mark_safe_to_retry", confirmed })}
          type="button"
        >
          Mark safe to retry
        </button>
        <Why reason={guards.markSafe.reason} />
      </div>
      {formError ? <p className="mt-2 text-xs font-bold text-red-700">{formError}</p> : null}
    </div>
  );
}

export function ErrorDetailPanel({
  event,
  detailLoaded,
  isLoadingDetail,
  isMutating,
  onNotice,
  onSaveNotes,
  onResolve,
  onRepair,
  onClaim
}: {
  event: AdminErrorEvent;
  /** True once GET /errors/:id arrived; the list row has no token, trail or stack. */
  detailLoaded: boolean;
  isLoadingDetail: boolean;
  isMutating: boolean;
  onNotice: (message: string) => void;
  onSaveNotes: (adminNotes: string) => void;
  onResolve: (adminNotes: string) => void;
  onRepair: () => void;
  onClaim: (body: Record<string, unknown>) => void;
}) {
  const [adminNotes, setAdminNotes] = useState(event.adminNotes ?? "");
  useEffect(() => setAdminNotes(event.adminNotes ?? ""), [event.id, event.adminNotes]);

  const copy = (text: string, message: string) => {
    void navigator.clipboard?.writeText(text);
    onNotice(message);
  };

  const emailSource = describeEmailSource(event.userEmailSource);
  const hasToken = Boolean(event.authorizationHeader);
  const calls = event.apiCalls ?? [];
  const loadingNote = (
    <p className="text-xs font-semibold text-muted">{isLoadingDetail ? "Loading full record..." : "Full record unavailable."}</p>
  );

  return (
    <div className="grid gap-3">
      <h2 className="font-display text-lg font-black text-midnight">Error Details</h2>

      <div className="rounded-xl border border-line bg-[#f8fdfe] p-3">
        <p className="text-[10px] font-black uppercase tracking-wide text-muted">User to contact</p>
        {event.userEmail ? (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="break-all font-mono text-sm font-bold text-midnight">{event.userEmail}</p>
            {emailSource.unverified ? (
              <span
                className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700"
                title={`Source: ${event.userEmailSource}. Hint only, not a verified identity.`}
              >
                unverified ({event.userEmailSource})
              </span>
            ) : null}
            <button className={GHOST_BTN} disabled={isMutating} onClick={() => copy(event.userEmail ?? "", "Email copied")} type="button">
              Copy email
            </button>
          </div>
        ) : (
          <p className="mt-1 text-sm font-semibold text-muted">
            No email on this request
            {event.noEmailReason ? (
              <span className="ml-2 rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-bold text-midnight">
                {event.noEmailReason}
              </span>
            ) : null}
          </p>
        )}
      </div>

      {detailLoaded ? <ClaimSection event={event} isMutating={isMutating} onClaim={onClaim} /> : null}

      <dl className="grid grid-cols-[130px_1fr] gap-2 text-sm">
        <Row label="Request ID">
          <span className="font-mono text-xs">{event.requestId}</span>
        </Row>
        <Row label="API">
          <span className="font-mono text-xs">
            {event.method} {event.path}
          </span>
        </Row>
        <Row label="Source / kind">
          {event.source ?? "server"} / {event.kind ?? "http_error"}
        </Row>
        <Row label="Screen">{event.screen}</Row>
        <Row label="Scenario">{event.scenario}</Row>
        <Row label="Stage">{event.stage}</Row>
        <Row label="Error name">{event.errorName}</Row>
        <Row label="IP">
          {event.clientIp ? `${event.clientIp}${event.clientIpSource ? ` (${event.clientIpSource})` : ""}` : null}
        </Row>
        <Row label="Email source">{event.userEmailSource}</Row>
        <Row label="Provider">
          {event.providerName ?? "N/A"} {event.providerStatusCode ?? ""}
        </Row>
        <Row label="Payment">{event.relatedPaymentReference}</Row>
        <Row label="Package">{event.relatedPackageId}</Row>
        <Row label="ICCID">{event.relatedIccid}</Row>
        <Row label="Repair action">{event.repairAction}</Row>
      </dl>

      <div>
        <p className={HEADING}>Device</p>
        <dl className="mt-1 grid grid-cols-[130px_1fr] gap-2 text-sm">
          <Row label="Platform">{event.platform}</Row>
          <Row label="App version">
            {event.appVersion ? `${event.appVersion}${event.appBuild ? ` (${event.appBuild})` : ""}` : null}
          </Row>
          <Row label="OS">{event.osVersion}</Row>
          <Row label="Model">{event.deviceModel}</Row>
          <Row label="Device ID">
            <span className="font-mono text-xs">{event.deviceId}</span>
          </Row>
          <Row label="User agent">
            <span className="text-xs">{event.userAgent}</span>
          </Row>
        </dl>
      </div>

      {detailLoaded ? (
        event.stack ? (
          <div>
            <p className={HEADING}>Stack</p>
            <pre className={`${PRE} max-h-64`}>{event.stack}</pre>
          </div>
        ) : null
      ) : event.hasStack ? (
        <div>
          <p className={HEADING}>Stack</p>
          {loadingNote}
        </div>
      ) : null}

      <div>
        <p className={HEADING}>Original request body</p>
        <pre className={PRE}>{stringifyJson(event.originalRequestBody)}</pre>
      </div>
      <div>
        <p className={HEADING}>Safe request body</p>
        <pre className={PRE}>{stringifyJson(event.safeRequestBody)}</pre>
      </div>
      <div>
        <p className={HEADING}>Safe query</p>
        <pre className={`${PRE} max-h-32`}>{stringifyJson(event.safeQuery)}</pre>
      </div>
      <div>
        <p className={HEADING}>Backend response</p>
        <pre className={PRE}>{displayBackendResponse(event)}</pre>
      </div>

      <details className="rounded-xl border border-line p-2.5" open={detailLoaded && calls.length > 0 && calls.length <= 3}>
        <summary className={`${HEADING} cursor-pointer`}>
          API call trail ({detailLoaded ? calls.length : (event.apiCallCount ?? 0)})
        </summary>
        <div className="mt-2 grid gap-2">
          {!detailLoaded ? loadingNote : null}
          {detailLoaded && calls.length === 0 ? <p className="text-xs font-semibold text-muted">No client call trail recorded.</p> : null}
          {calls.map((call, index) => (
            <ApiCallItem call={call} index={index} key={`${call.requestId ?? "call"}-${index}`} />
          ))}
        </div>
      </details>

      {detailLoaded && event.clientContext != null ? (
        <details className="rounded-xl border border-line p-2.5">
          <summary className={`${HEADING} cursor-pointer`}>Client context</summary>
          <pre className={PRE}>{stringifyJson(event.clientContext)}</pre>
        </details>
      ) : null}

      <div>
        <p className={HEADING}>Replay cURL</p>
        <p className="mt-1 text-[11px] font-semibold text-muted">
          Targets the public API with the stored Bearer
          {isLoadingDetail ? " (loading full record...)" : hasToken ? "" : " (none stored: placeholder shown)"}. Tokens expire.
          Card fields are never included.
        </p>
        {detailLoaded ? <pre className={PRE}>{buildBackendCurl(event)}</pre> : loadingNote}
      </div>

      <label className={HEADING}>
        Admin notes
        <textarea
          className="mt-1 min-h-24 w-full rounded-xl border border-line p-2.5 text-sm font-normal normal-case tracking-normal text-midnight outline-none focus:border-cyan"
          onChange={(e) => setAdminNotes(e.target.value)}
          value={adminNotes}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button className={GHOST_BTN} disabled={isMutating} onClick={() => copy(event.requestId, "Request id copied")} type="button">
          Copy request id
        </button>
        <button className={GHOST_BTN} disabled={isMutating || !detailLoaded} onClick={() => copy(buildBackendCurl(event), "cURL copied")} type="button">
          Copy cURL
        </button>
        <button className={GHOST_BTN} disabled={isMutating || !detailLoaded} onClick={() => copy(buildFullReport(event), "Full report copied")} type="button">
          Copy full report
        </button>
        <button
          className="rounded-lg bg-gradient-to-r from-midnight to-ink px-3 py-2 text-xs font-black text-aqua shadow-sm transition hover:opacity-90 disabled:opacity-50"
          disabled={isMutating}
          onClick={() => onSaveNotes(adminNotes)}
          type="button"
        >
          Save notes
        </button>
        <button
          className="rounded-lg bg-green-700 px-3 py-2 text-xs font-black text-white transition hover:bg-green-800 disabled:opacity-50"
          disabled={isMutating}
          onClick={() => onResolve(adminNotes)}
          type="button"
        >
          Mark resolved
        </button>
        {event.repairAction ? (
          <button
            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-700 transition hover:border-red-400 disabled:opacity-50"
            disabled={isMutating}
            onClick={onRepair}
            type="button"
          >
            Run repair
          </button>
        ) : null}
      </div>
    </div>
  );
}
