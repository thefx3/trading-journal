export function getPreviousTradingDate(dates: string[], currentDate: string) {
  return dates.filter((date) => date < currentDate).toSorted((a, b) => b.localeCompare(a))[0] ?? null;
}
