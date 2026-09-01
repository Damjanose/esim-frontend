/**
 * Which frame of the route animation represents `activeIndex`'s progress
 * through `totalSteps`. Step 0 lands at 1/totalSteps of the way through
 * (not 0) so the first step still reads as "underway," not "not started."
 */
export function frameForStep(
  activeIndex: number,
  totalSteps: number,
  totalFrames: number,
): number {
  const progress = (activeIndex + 1) / totalSteps;
  return Math.round((totalFrames - 1) * progress);
}

/**
 * Every tick index that transitioned from active/pending to done when the
 * step moved from `previousIndex` to `activeIndex`. Handles a multi-step
 * jump (returns every index skipped over) and returns nothing if the index
 * didn't advance.
 */
export function newlyDoneIndices(previousIndex: number, activeIndex: number): number[] {
  const result: number[] = [];
  for (let index = previousIndex; index < activeIndex; index += 1) {
    result.push(index);
  }
  return result;
}
