import { describe, expect, it } from "vitest";
import { friendlyError } from "./marketingErrors";

describe("friendlyError", () => {
  it("turns backend field codes into plain messages", () => {
    expect(friendlyError("invalid_source")).toBe("Enter a source, such as google.");
    expect(friendlyError("invalid_amountCents")).toBe("Enter an amount above 0.");
    expect(friendlyError("invalid_title")).toBe("Enter a title of 1 to 80 characters.");
  });

  it("explains a missing entry", () => {
    expect(friendlyError("not_found")).toBe("That item no longer exists. Refresh and try again.");
  });

  it("asks the admin to sign in again on unauthorized", () => {
    expect(friendlyError("unauthorized")).toBe("Session expired. Sign in again.");
  });

  it("gives a clear message for network failures and unknown codes", () => {
    expect(friendlyError("network")).toBe("Could not reach the server. Try again.");
    expect(friendlyError("something_odd")).toBe("Could not save. Try again.");
  });
});
