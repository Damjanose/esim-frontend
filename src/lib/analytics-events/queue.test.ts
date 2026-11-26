import { describe, expect, it } from "vitest";
import type { ClientEvent } from "@/lib/analytics-events/contract";
import { createEventQueue, type SendOutcome } from "./queue";

const event = (n: number): ClientEvent => ({ type: "screen_view", at: "2026-11-26T10:00:00Z", screen: `/p${n}` });

function queueWith(outcomes: SendOutcome[] | ((batch: ClientEvent[]) => SendOutcome), beacon?: (batch: ClientEvent[]) => boolean) {
  const sent: ClientEvent[][] = [];
  let call = 0;
  const queue = createEventQueue({
    send: async (batch) => {
      sent.push(batch);
      if (typeof outcomes === "function") return outcomes(batch);
      return outcomes[Math.min(call++, outcomes.length - 1)];
    },
    beacon
  });
  return { queue, sent };
}

describe("event queue", () => {
  it("sends at most 20 events in one batch", async () => {
    const { queue, sent } = queueWith([200]);
    for (let i = 0; i < 25; i++) queue.enqueue(event(i));
    await queue.flush();
    expect(sent[0]).toHaveLength(20);
    expect(queue.size()).toBe(5);
  });

  it("keeps at most 200 queued events, dropping the oldest", () => {
    const { queue } = queueWith([200]);
    for (let i = 0; i < 205; i++) queue.enqueue(event(i));
    expect(queue.size()).toBe(200);
    expect(queue.peekAll()[0]).toEqual(event(5));
  });

  it("drops the batch on 400", async () => {
    const { queue } = queueWith([400]);
    queue.enqueue(event(1));
    await queue.flush();
    expect(queue.size()).toBe(0);
  });

  it("keeps the batch on 429 and on 5xx", async () => {
    const { queue } = queueWith([429, 503]);
    queue.enqueue(event(1));
    await queue.flush();
    expect(queue.size()).toBe(1);
    await queue.flush();
    expect(queue.size()).toBe(1);
  });

  it("keeps the batch on a network error", async () => {
    const { queue } = queueWith([null]);
    queue.enqueue(event(1));
    await queue.flush();
    expect(queue.size()).toBe(1);
  });

  it("keeps the batch through any number of network failures, which do not count toward the limit", async () => {
    const { queue } = queueWith([null]);
    queue.enqueue(event(1));
    for (let i = 0; i < 10; i++) await queue.flush();
    expect(queue.size()).toBe(1);
  });

  it("counts only HTTP failures: 10 network errors, then 5 x 503 drops the batch on the fifth 503", async () => {
    const outcomes: SendOutcome[] = [...Array(10).fill(null), 503, 503, 503, 503, 503];
    const { queue, sent } = queueWith(outcomes);
    queue.enqueue(event(1));
    for (let i = 0; i < 10; i++) await queue.flush();
    expect(queue.size()).toBe(1);
    for (let i = 0; i < 4; i++) await queue.flush();
    expect(queue.size()).toBe(1);
    await queue.flush();
    expect(queue.size()).toBe(0);
    expect(sent).toHaveLength(15);
  });

  it("drops the batch after 5 failures", async () => {
    const { queue, sent } = queueWith([503]);
    queue.enqueue(event(1));
    for (let i = 0; i < 4; i++) await queue.flush();
    expect(queue.size()).toBe(1);
    await queue.flush();
    expect(queue.size()).toBe(0);
    expect(sent).toHaveLength(5);
  });

  it("flushOnHide uses navigator.sendBeacon when it accepts the batch", async () => {
    const beaconCalls: ClientEvent[][] = [];
    const { queue, sent } = queueWith([200], (batch) => {
      beaconCalls.push(batch);
      return true;
    });
    queue.enqueue(event(1));
    queue.enqueue(event(2));
    queue.flushOnHide();
    expect(beaconCalls).toHaveLength(1);
    expect(beaconCalls[0]).toHaveLength(2);
    expect(queue.size()).toBe(0);
    expect(sent).toHaveLength(0);
  });

  it("flushOnHide falls back to a normal send when the beacon is refused", async () => {
    const { queue, sent } = queueWith([200], () => false);
    queue.enqueue(event(1));
    queue.flushOnHide();
    await Promise.resolve();
    await Promise.resolve();
    expect(sent).toHaveLength(1);
  });

  it("does not beacon a batch that is already being sent", async () => {
    let finish: (status: SendOutcome) => void = () => undefined;
    const beaconCalls: ClientEvent[][] = [];
    const queue = createEventQueue({
      send: () =>
        new Promise<SendOutcome>((resolve) => {
          finish = resolve;
        }),
      beacon: (batch) => {
        beaconCalls.push(batch);
        return true;
      }
    });
    queue.enqueue(event(1));
    queue.enqueue(event(2));
    const inFlight = queue.flush();
    queue.flushOnHide();
    expect(beaconCalls).toEqual([]);
    finish(503);
    await inFlight;
    // The batch failed, so it is back in the queue for the next attempt.
    expect(queue.size()).toBe(2);
  });

  it("removes a sent batch from the queue before the request returns", async () => {
    let finish: (status: SendOutcome) => void = () => undefined;
    const queue = createEventQueue({
      send: () =>
        new Promise<SendOutcome>((resolve) => {
          finish = resolve;
        })
    });
    queue.enqueue(event(1));
    const inFlight = queue.flush();
    expect(queue.size()).toBe(0);
    finish(200);
    await inFlight;
    expect(queue.size()).toBe(0);
  });
});
