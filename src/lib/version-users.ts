export type VersionUserRow = {
  deviceId: string;
  platform: string;
  version: string;
  email: string | null;
  lastSeen: string;
  isOutdated: boolean;
};

export type VersionUserFilter = {
  outdatedOnly: boolean;
  platform: "all" | "ios" | "android";
};

export const DEFAULT_UPDATE_TITLE = "Update available";
export const DEFAULT_UPDATE_BODY =
  "A new version of eSIM2you is available. Please update the app to keep everything running smoothly.";

export function filterVersionUsers(rows: VersionUserRow[], filter: VersionUserFilter): VersionUserRow[] {
  return rows.filter(
    (row) =>
      (!filter.outdatedOnly || row.isOutdated) && (filter.platform === "all" || row.platform === filter.platform)
  );
}

export function canNotify(row: VersionUserRow): boolean {
  return Boolean(row.email);
}
