import { describe, expect, it } from "vitest";
import { isBotUserAgent } from "./bot";

describe("isBotUserAgent", () => {
  it.each(["Googlebot/2.1", "bingbot/2.0", "AhrefsBot/7.0", "Mozilla/5.0 HeadlessChrome/120", "curl/8.4.0", ""])(
    "treats %j as a bot",
    (ua) => {
      expect(isBotUserAgent(ua)).toBe(true);
    }
  );

  it("does not treat a normal Safari user agent as a bot", () => {
    expect(
      isBotUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1")
    ).toBe(false);
  });
});
