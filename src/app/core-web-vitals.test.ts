import { existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Core Web Vitals performance contract", () => {
  it("serves the homepage hero through next/image with a lightweight WebP source", async () => {
    const pageSource = await readFile(join(process.cwd(), "src/app/page.tsx"), "utf8");
    const heroWebpPath = join(process.cwd(), "public/images/hero-map-and-phone.webp");

    expect(pageSource).toContain('import Image from "next/image"');
    expect(pageSource).toContain('src="/images/hero-map-and-phone.webp"');
    expect(pageSource).toContain("priority");
    expect(pageSource).toContain('sizes="(max-width: 1024px) 100vw, 850px"');
    expect(existsSync(heroWebpPath)).toBe(true);
    expect(statSync(heroWebpPath).size).toBeLessThan(450 * 1024);
  });

  it("allows the remote image hosts used by public marketing images", async () => {
    const configSource = await readFile(join(process.cwd(), "next.config.mjs"), "utf8");

    expect(configSource).toContain('hostname: "images.unsplash.com"');
    expect(configSource).toContain('hostname: "upload.wikimedia.org"');
  });
});
