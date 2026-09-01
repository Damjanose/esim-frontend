import { describe, expect, it } from "vitest";
import { frameForStep, newlyDoneIndices } from "./boardingPassStepper";

describe("frameForStep", () => {
  it("maps the first step to one third of the way through the animation", () => {
    expect(frameForStep(0, 3, 90)).toBe(Math.round(89 * (1 / 3)));
  });

  it("maps the middle step to two thirds of the way through", () => {
    expect(frameForStep(1, 3, 90)).toBe(Math.round(89 * (2 / 3)));
  });

  it("maps the last step to the final frame", () => {
    expect(frameForStep(2, 3, 90)).toBe(89);
  });

  it("rounds to the nearest whole frame", () => {
    // 7 frames total (indices 0-6), step 0 of 3 -> 6 * (1/3) = 2
    expect(frameForStep(0, 3, 7)).toBe(2);
  });
});

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
