import { describe, expect, it } from "vitest";
import {
  DEFAULT_UPDATE_BODY,
  DEFAULT_UPDATE_TITLE,
  canNotify,
  filterVersionUsers,
  type VersionUserRow,
} from "./version-users";

const rows: VersionUserRow[] = [
  { deviceId: "d1", platform: "ios", version: "1.0.0", email: "a@x.com", lastSeen: "2026-11-01T00:00:00Z", isOutdated: true },
  { deviceId: "d2", platform: "android", version: "1.0.0", email: null, lastSeen: "2026-11-02T00:00:00Z", isOutdated: true },
  { deviceId: "d3", platform: "android", version: "2.0.0", email: "b@x.com", lastSeen: "2026-11-03T00:00:00Z", isOutdated: false },
];

describe("version-users helpers", () => {
  it("filters outdated only", () => {
    expect(filterVersionUsers(rows, { outdatedOnly: true, platform: "all" }).map((r) => r.deviceId)).toEqual(["d1", "d2"]);
  });

  it("filters by platform", () => {
    expect(filterVersionUsers(rows, { outdatedOnly: false, platform: "android" }).map((r) => r.deviceId)).toEqual(["d2", "d3"]);
  });

  it("combines both filters", () => {
    expect(filterVersionUsers(rows, { outdatedOnly: true, platform: "android" }).map((r) => r.deviceId)).toEqual(["d2"]);
  });

  it("canNotify requires an email", () => {
    expect(canNotify(rows[0])).toBe(true);
    expect(canNotify(rows[1])).toBe(false);
  });

  it("exposes a non-empty default message", () => {
    expect(DEFAULT_UPDATE_TITLE.length).toBeGreaterThan(0);
    expect(DEFAULT_UPDATE_BODY).toContain("update");
  });
});
