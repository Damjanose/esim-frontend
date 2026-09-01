// E-SIM-frontend/src/app/destinations/boardingPassStepper.ts

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
