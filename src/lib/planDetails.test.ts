import { describe, expect, it } from "vitest";
import { activationNote, mapPlanDetails, networksLabel, unlimitedPlanCopy } from "./planDetails";

describe("mapPlanDetails", () => {
  it("is undefined when the package came from the unfiltered list", () => {
    expect(mapPlanDetails({})).toBeUndefined();
  });

  it("maps the country-filtered fields and tolerates junk", () => {
    expect(
      mapPlanDetails({
        activation_policy: "first-usage",
        plan_type: "data",
        other_info: " note ",
        networks: [{ name: "EE", types: ["4G", "5G"] }, { name: "", types: [] }, null],
        fair_usage: { policy: "Fair use", high_speed_mb_per_day: 2048, throttled_speed_kbps: 512 }
      })
    ).toEqual({
      activationPolicy: "first-usage",
      planType: "data",
      otherInfo: "note",
      networks: [{ name: "EE", types: ["4G", "5G"] }],
      fairUsage: { policy: "Fair use", highSpeedMbPerDay: 2048, throttledSpeedKbps: 512 }
    });
    expect(mapPlanDetails({ networks: [], fair_usage: null })?.fairUsage).toBeNull();
  });
});

describe("unlimitedPlanCopy", () => {
  const base = { activationPolicy: null, planType: null, otherInfo: null, networks: [] };
  it("states the numbers when the provider gives them", () => {
    expect(
      unlimitedPlanCopy({ ...base, fairUsage: { policy: "x", highSpeedMbPerDay: 2048, throttledSpeedKbps: 1500 } })
    ).toBe("Unlimited · high speed up to 2 GB/day, then 1.5 Mbps");
    expect(
      unlimitedPlanCopy({ ...base, fairUsage: { policy: null, highSpeedMbPerDay: 512, throttledSpeedKbps: 256 } })
    ).toBe("Unlimited · high speed up to 512 MB/day, then 256 kbps");
  });
  it("falls back to the policy text, then to a neutral line", () => {
    expect(
      unlimitedPlanCopy({ ...base, fairUsage: { policy: "Slowed after 2GB/day.", highSpeedMbPerDay: null, throttledSpeedKbps: null } })
    ).toBe("Slowed after 2GB/day.");
    expect(unlimitedPlanCopy({ ...base, fairUsage: null })).toBe("Unlimited (fair-use policy applies)");
    expect(unlimitedPlanCopy(undefined)).toBe("Unlimited (fair-use policy applies)");
  });
});

describe("activationNote / networksLabel", () => {
  const base = { planType: null, otherInfo: null, networks: [], fairUsage: null };
  it("explains when the plan starts, only when known", () => {
    expect(activationNote({ ...base, activationPolicy: "first-usage" }, "Japan")).toBe(
      "Starts when you first connect in Japan"
    );
    expect(activationNote({ ...base, activationPolicy: "installation" }, "Japan")).toBe(
      "Starts when you install the eSIM"
    );
    expect(activationNote({ ...base, activationPolicy: "mystery" }, "Japan")).toBeNull();
    expect(activationNote(undefined, "Japan")).toBeNull();
  });
  it("lists networks with their best generation", () => {
    expect(
      networksLabel({
        ...base,
        activationPolicy: null,
        networks: [{ name: "EE", types: ["4G", "5G"] }, { name: "Vodafone", types: ["4G"] }, { name: "Three", types: [] }]
      })
    ).toBe("EE 5G · Vodafone 4G · Three");
    expect(networksLabel(undefined)).toBeNull();
  });
});
