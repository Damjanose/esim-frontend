// E-SIM-frontend/src/app/destinations/boardingPassStepper.test.ts
import { describe, expect, it } from "vitest";
import { newlyDoneIndices } from "./boardingPassStepper";

describe("newlyDoneIndices", () => {
  it("returns nothing when the step hasn't advanced", () => {
    expect(newlyDoneIndices(0, 0)).toEqual([]);
  });

  it("returns the single tick that just completed on a normal forward step", () => {
    expect(newlyDoneIndices(0, 1)).toEqual([0]);
  });

  it("returns every tick skipped over on a multi-step jump", () => {
    expect(newlyDoneIndices(0, 2)).toEqual([0, 1]);
  });

  it("returns nothing when the index moves backward", () => {
    // HelpMeChooseWizard has no back-navigation today, but the function
    // should not mis-stamp if that ever changes.
    expect(newlyDoneIndices(2, 1)).toEqual([]);
  });
});
