import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { TitleField } from "./TitleField";

describe("TitleField", () => {
  it("renders a labelled text input capped at 120 characters", () => {
    const markup = renderToStaticMarkup(createElement(TitleField, { value: "Cup final", onChange: vi.fn() }));

    expect(markup).toContain("Name");
    expect(markup).toContain('id="event-modal-title"');
    expect(markup).toContain('maxLength="120"');
    expect(markup).toContain('value="Cup final"');
    expect(markup).toContain("120");
  });

  it("is mounted in the editor shell and writes to the draft title", () => {
    const shell = readFileSync("src/app/xeventsy/editor/EditorShell.tsx", "utf8");

    expect(shell).toContain("<TitleField");
    expect(shell).toContain("patchDraft({ title");
  });
});
