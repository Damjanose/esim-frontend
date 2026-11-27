export type FunnelInput = { step: string; visitors: number };

export type StepRate = FunnelInput & {
  /** Share of the first step's visitors (0..1), null when the first step is zero. */
  shareOfFirst: number | null;
  /** Share lost from the step before (0..1), null for the first step or when that step is zero. */
  dropFromPrevious: number | null;
};

/** Each step counts visitors who reached it. */
export function stepRates<T extends FunnelInput>(steps: T[]): Array<T & Omit<StepRate, keyof FunnelInput>> {
  const first = steps[0]?.visitors ?? 0;
  return steps.map((item, index) => {
    const previous = index > 0 ? steps[index - 1].visitors : null;
    return {
      ...item,
      shareOfFirst: first > 0 ? item.visitors / first : null,
      dropFromPrevious: previous !== null && previous > 0 ? 1 - item.visitors / previous : null
    };
  });
}
