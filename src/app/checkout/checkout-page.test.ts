import { describe, expect, it, vi } from "vitest";

const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url) }));

const { default: CheckoutPage } = await import("./page");

describe("checkout page (web purchases disabled)", () => {
  it("forwards a package checkout to its open-in-app page", async () => {
    await expect(CheckoutPage({ searchParams: Promise.resolve({ package: "kosovo 1gb" }) })).rejects.toThrow(
      "REDIRECT:/pkg/kosovo%201gb"
    );
  });

  it("sends a bare /checkout to the destinations list", async () => {
    await expect(CheckoutPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("REDIRECT:/destinations");
  });
});
