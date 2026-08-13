import type { TradingSession } from "@/types/database";

const NEW_YORK_TIME = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const zonedFormatters = new Map<string, Intl.DateTimeFormat>();

function zonedFormatter(timezone: string) {
  let formatter = zonedFormatters.get(timezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    zonedFormatters.set(timezone, formatter);
  }
  return formatter;
}

function minutesInNewYork(date: Date) {
  const parts = NEW_YORK_TIME.formatToParts(date);
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return Number(value.hour) * 60 + Number(value.minute);
}

export function getTradingSession(
  instrument: string,
  datetime: Date,
): TradingSession {
  void instrument;
  const minutes = minutesInNewYork(datetime);
  if (minutes >= 480 && minutes < 720) return "new_york_am";
  if (minutes >= 720 && minutes < 810) return "new_york_lunch";
  if (minutes >= 810 && minutes < 1020) return "new_york_pm";
  if (minutes >= 180 && minutes < 720) return "london";
  if (minutes >= 1080 || minutes < 180) return "asia";
  return "other";
}

export function localTradeTimeToUtc(
  date: string,
  time: string,
  timezone: string,
) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const desired = Date.UTC(year, month - 1, day, hour, minute);
  let instant = desired;
  for (let attempt = 0; attempt < 2; attempt++) {
    const parts = zonedFormatter(timezone).formatToParts(new Date(instant));
    const rendered = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );
    const renderedUtc = Date.UTC(
      +rendered.year,
      +rendered.month - 1,
      +rendered.day,
      +rendered.hour,
      +rendered.minute,
    );
    instant += desired - renderedUtc;
  }
  return new Date(instant);
}
