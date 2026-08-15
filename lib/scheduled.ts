// Pure helpers for installments & recurring payments. No I/O — unit-tested.
// All dates are handled in UTC as YYYY-MM-DD strings to avoid timezone drift.

function isoOf(y: number, m0: number, day: number): string {
  return new Date(Date.UTC(y, m0, day)).toISOString().slice(0, 10);
}
function daysInMonth(y: number, m0: number): number {
  return new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();
}
function monthParts(iso: string): { y: number; m0: number } {
  const [y, m] = iso.split("-").map(Number);
  return { y, m0: m - 1 };
}

/**
 * Split an integer agorot total into `count` integer payments that sum exactly
 * to the total. Any rounding remainder is added to the LAST payment.
 */
export function splitInstallments(totalAgorot: number, count: number): number[] {
  if (count < 1) return [];
  const per = Math.floor(totalAgorot / count);
  const out = Array.from({ length: count }, () => per);
  out[count - 1] += totalAgorot - per * count;
  return out;
}

/**
 * `count` monthly dates starting at `startISO`, keeping the same day-of-month
 * and clamping to the month length (e.g. Jan 31 -> Feb 28).
 */
export function installmentDates(startISO: string, count: number): string[] {
  const [y, m, d] = startISO.split("-").map(Number);
  const out: string[] = [];
  for (let k = 0; k < count; k++) {
    const total = (m - 1) + k; // m is 1-based
    const yy = y + Math.floor(total / 12);
    const mm0 = ((total % 12) + 12) % 12;
    out.push(isoOf(yy, mm0, Math.min(d, daysInMonth(yy, mm0))));
  }
  return out;
}

/**
 * The 1st-of-month ISO strings, from the month of `startMonthISO` through the
 * month of `throughISO` (inclusive), excluding any already in `existingPeriods`.
 * Used to backfill missing recurring occurrences up to the current month.
 */
export function duePeriods(
  startMonthISO: string,
  throughISO: string,
  existingPeriods: string[],
): string[] {
  const existing = new Set(
    existingPeriods.map((p) => {
      const { y, m0 } = monthParts(p);
      return isoOf(y, m0, 1);
    }),
  );
  const start = monthParts(startMonthISO);
  const through = monthParts(throughISO);
  const out: string[] = [];
  let { y, m0 } = start;
  while (y < through.y || (y === through.y && m0 <= through.m0)) {
    const p = isoOf(y, m0, 1);
    if (!existing.has(p)) out.push(p);
    m0 += 1;
    if (m0 > 11) { m0 = 0; y += 1; }
  }
  return out;
}
