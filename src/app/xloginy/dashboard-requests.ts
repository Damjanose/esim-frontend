import type { ProviderDetails, ProviderState } from "./dashboard-model";

type AdminRequest = {
  token: string;
  signal: AbortSignal;
  isCurrent: () => boolean;
  onUnauthorized: () => void;
};

export async function requestAdminData<T>(
  path: string,
  request: AdminRequest,
): Promise<T> {
  const response = await fetch(path, {
    headers: { Authorization: `Bearer ${request.token}` },
    cache: "no-store",
    signal: request.signal,
  });
  if (request.signal.aborted || !request.isCurrent())
    throw new DOMException("Request cancelled", "AbortError");
  if (response.status === 401) {
    request.onUnauthorized();
    throw new Error("Session expired. Sign in again.");
  }
  const payload = (await response.json()) as {
    status?: string;
    data?: T;
    message?: string;
  };
  if (!response.ok || payload.status !== "success" || !payload.data)
    throw new Error(payload.message || "Could not load data.");
  if (request.signal.aborted || !request.isCurrent())
    throw new DOMException("Request cancelled", "AbortError");
  return payload.data;
}

export function createProviderChecks(options: {
  token: string;
  isCurrent: () => boolean;
  onUnauthorized: () => void;
  onState: (id: string, state: ProviderState) => void;
}) {
  const cache: Record<string, ProviderState> = {};
  const requests = new Map<string, {
    promise: Promise<void>;
    controller: AbortController;
    previous?: ProviderState;
  }>();
  const check = (id: string, retry = false): Promise<void> => {
    if (!options.token) return Promise.resolve();
    const inFlight = requests.get(id);
    if (inFlight) return inFlight.promise;
    const cached = cache[id];
    const ttl = cached?.data?.sims.some((sim) => sim.error) ? 30_000 : 20 * 60_000;
    if (
      !retry && cached?.data &&
      Date.now() - new Date(cached.data.checkedAt).getTime() < ttl
    )
      return Promise.resolve();
    const controller = new AbortController();
    const publish = (state: ProviderState) => {
      if (controller.signal.aborted || !options.isCurrent()) return;
      cache[id] = state;
      options.onState(id, state);
    };
    publish({ ...cached, loading: true, error: undefined });
    const promise = (async () => {
      try {
        const data = await requestAdminData<ProviderDetails>(
          `/bff/admin/dashboard/purchases/${encodeURIComponent(id)}/provider`,
          { ...options, signal: controller.signal },
        );
        publish({ data });
      } catch (err) {
        if (!controller.signal.aborted)
          publish({
            data: cached?.data,
            error: err instanceof Error ? err.message : "Airalo check failed.",
          });
      } finally {
        if (requests.get(id)?.controller === controller) requests.delete(id);
      }
    })();
    requests.set(id, { promise, controller, previous: cached });
    return promise;
  };
  const cancelPending = () => {
    for (const [id, { controller, previous }] of requests) {
      controller.abort();
      cache[id] = previous ?? {};
      if (options.isCurrent()) options.onState(id, cache[id]);
    }
    requests.clear();
  };
  return { check, cancelPending };
}

export function startProviderQueue(
  ids: string[],
  checks: ReturnType<typeof createProviderChecks>,
) {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const run = async (index: number) => {
    if (cancelled || index >= ids.length) return;
    await checks.check(ids[index]);
    if (!cancelled) timer = setTimeout(() => void run(index + 1), 650);
  };
  void run(0);
  return () => {
    cancelled = true;
    clearTimeout(timer);
    checks.cancelPending();
  };
}
