import { MAX_EVENTS_PER_BATCH, MAX_QUEUED_EVENTS, type ClientEvent } from "./contract";

/** HTTP status of a send, or null when no response came back. */
export type SendOutcome = number | null;

const MAX_FAILURES = 5;

/**
 * Pure event queue: at most 20 events per batch, at most 200 queued (oldest dropped first).
 * 429, 5xx and network errors keep the batch for the next flush; other responses drop it;
 * a batch that failed 5 times is dropped.
 */
export function createEventQueue(deps: {
  send: (batch: ClientEvent[]) => Promise<SendOutcome>;
  beacon?: (batch: ClientEvent[]) => boolean;
}) {
  let pending: ClientEvent[] = [];
  let failures = 0;
  let inFlight: Promise<void> | null = null;

  /**
   * The batch leaves `pending` before it is sent, so a page-hide beacon never sends it a
   * second time. It goes back to the front of the queue only when the send must be retried.
   */
  async function flushOnce(): Promise<void> {
    const batch = pending.splice(0, MAX_EVENTS_PER_BATCH);
    if (batch.length === 0) return;
    const status = await deps.send(batch);
    // 400 (and other 4xx) drops the batch. A network error keeps it and does not count toward the limit.
    // Only real HTTP failures (429, 5xx) count, and the fifth one drops the batch.
    if (status !== null && status !== 429 && status < 500) {
      failures = 0;
      return;
    }
    if (status !== null) {
      failures += 1;
      if (failures >= MAX_FAILURES) {
        failures = 0;
        return;
      }
    }
    pending = [...batch, ...pending];
    if (pending.length > MAX_QUEUED_EVENTS) pending = pending.slice(pending.length - MAX_QUEUED_EVENTS);
  }

  function flush(): Promise<void> {
    if (!inFlight) {
      inFlight = flushOnce().finally(() => {
        inFlight = null;
      });
    }
    return inFlight;
  }

  return {
    enqueue(event: ClientEvent) {
      pending.push(event);
      if (pending.length > MAX_QUEUED_EVENTS) pending = pending.slice(pending.length - MAX_QUEUED_EVENTS);
    },
    flush,
    /** For page hide: sends with the beacon when it accepts every batch, otherwise falls back to a normal flush. */
    flushOnHide() {
      if (!deps.beacon) {
        void flush();
        return;
      }
      while (pending.length > 0) {
        const batch = pending.slice(0, MAX_EVENTS_PER_BATCH);
        if (!deps.beacon(batch)) {
          void flush();
          return;
        }
        pending = pending.slice(batch.length);
      }
    },
    size: () => pending.length,
    peekAll: () => pending.slice()
  };
}
