import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RETIRED_COLOR_CLASS } from "../components/retiredTokens";

const read = (path: string) => readFileSync(`src/app/partners/${path}`, "utf8");
const HEX = /#[0-9a-fA-F]{3,8}\b/;

const pages = {
  withdraw: read("withdraw/page.tsx"),
  request: read("request/page.tsx"),
  status: read("status/page.tsx"),
  materials: read("materials/page.tsx")
};
const parts = {
  withdrawForm: read("withdraw/WithdrawForm.tsx"),
  verification: read("withdraw/VerificationForm.tsx"),
  payouts: read("withdraw/PayoutHistory.tsx"),
  requestForm: read("request/PartnerRequestForm.tsx")
};

describe("partner pages in the account shell", () => {
  it.each([
    ["withdraw", 'partnerShellItems("withdraw")'],
    ["request", "partnerShellItems(null)"],
    ["status", 'partnerShellItems("status")'],
    ["materials", 'partnerShellItems("materials")']
  ] as const)("/partners/%s uses the partner sidebar, sticky-safe, with Sign out", (name, items) => {
    const source = pages[name];
    expect(source).toContain(`items={${items}}`);
    expect(source).toContain('label="Partner"');
    expect(source).toContain('footer={<SignOutButton appearance="nav" />}');
    expect(source).toContain("overflow-x-clip");
    expect(source).not.toContain("overflow-x-hidden");
    expect(source).toContain("<Navbar />");
    expect(source).toContain("<SiteFooter />");
  });

  it("uses the shared field classes in every form", () => {
    expect(parts.withdrawForm).toContain("FIELD_INPUT_CLASSES");
    expect(parts.withdrawForm).toContain("FIELD_LABEL_CLASSES");
    expect(parts.requestForm).toContain("FIELD_INPUT_CLASSES");
    expect(parts.requestForm).toContain("FIELD_LABEL_CLASSES");
    expect(parts.verification).toContain("FIELD_LABEL_CLASSES");
    expect(parts.verification).toContain("FIELD_CONTROL_CLASSES");
  });

  it("gives each page one gradient", () => {
    // withdraw: Request withdrawal is the gradient; Verification's submit is flat.
    expect(parts.withdrawForm).not.toContain('variant="flat"');
    expect(parts.verification).toContain('variant="flat"');
    // request: Submit request.
    expect(parts.requestForm.match(/<Button\b/g)).toHaveLength(1);
    expect(parts.requestForm).not.toContain('variant="flat"');
    // status: the one status action; materials has no button besides the apply prompt.
    expect(pages.status.match(/<LinkButton\b[^>]*href=\{copy\.action\.href\}/g)).toHaveLength(1);
    expect(pages.materials).not.toContain('variant="primary"');
  });

  it("keeps every interactive control at 44px", () => {
    for (const source of [pages.withdraw, pages.request, pages.status, pages.materials]) {
      expect(source).toContain("min-h-11");
    }
    expect(pages.materials).toContain("inline-flex min-h-11");
  });

  it("keeps to tokens: no retired classes, amber, white, or hex", () => {
    for (const source of [...Object.values(pages), ...Object.values(parts)]) {
      expect(source).not.toMatch(RETIRED_COLOR_CLASS);
      expect(source).not.toContain("amber-");
      expect(source).not.toMatch(/\bbg-white\b/);
      expect(source).not.toMatch(HEX);
    }
  });

  it("keeps gating and redirects", () => {
    expect(pages.withdraw).toContain('new Set(["Suspended", "Cancelled"])');
    expect(pages.request).toContain('redirect("/partners/status")');
    expect(pages.status).toContain("STATUS_COPY");
  });
});
