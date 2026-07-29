export function formatMoney(agorot: number): string {
  return `₪${(agorot / 100).toFixed(2)}`;
}

export function agorotFromInput(input: string): number {
  const value = Number.parseFloat(input);
  if (Number.isNaN(value)) return NaN;
  return Math.round(value * 100);
}
