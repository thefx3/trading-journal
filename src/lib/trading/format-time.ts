export function formatTimeInZone(value: string | Date, timezone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(typeof value === "string" ? new Date(value) : value);
}
