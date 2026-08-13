"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { RR_PRESETS, SESSION_LABELS } from "@/lib/trading/config";
import { formatTimeInZone } from "@/lib/trading/format-time";
import { getTradingSession, localTradeTimeToUtc } from "@/lib/trading/sessions";
import type { Direction, StudyEntry } from "@/types/database";

type Draft = {
  time: string;
  direction: Direction;
  plannedRr: number;
  realizedR: number;
};

function automaticSession(
  instrument: string,
  date: string,
  time: string,
  timezone: string,
) {
  return time
    ? getTradingSession(instrument, localTradeTimeToUtc(date, time, timezone))
    : ("other" as const);
}
function initialDraft(timezone: string): Draft {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value]),
  );
  return {
    time: `${parts.hour}:${parts.minute}`,
    direction: "long",
    plannedRr: 2,
    realizedR: 2,
  };
}

export function StudyEntriesEditor({
  formId,
  instrument,
  date,
  timezone,
  initialEntries,
}: {
  formId: string;
  instrument: string;
  date: string;
  timezone: string;
  initialEntries: StudyEntry[];
}) {
  const [entries, setEntries] = useState<Draft[]>(() =>
    initialEntries.map((entry) => ({
      time: formatTimeInZone(entry.entry_at, timezone),
      direction: entry.direction,
      plannedRr: Number(entry.planned_rr),
      realizedR: Number(entry.realized_r),
    })),
  );
  function update(index: number, patch: Partial<Draft>) {
    setEntries((current) =>
      current.map((entry, position) =>
        position === index ? { ...entry, ...patch } : entry,
      ),
    );
  }
  const serializedEntries = entries.map((entry) => {
    const session = automaticSession(instrument, date, entry.time, timezone);
    return {
      ...entry,
      session,
      sessionOverride: false,
      result: entry.realizedR > 0 ? "win" : entry.realizedR < 0 ? "loss" : "be",
    };
  });
  return (
    <section className="mt-6">
      <input
        form={formId}
        type="hidden"
        name="studyEntries"
        value={JSON.stringify(serializedEntries)}
      />
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Potential entries</h3>
          <p className="mt-1 text-xs text-muted">
            Each valid setup counts as a separate Study trade.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={entries.length >= 10}
          onClick={() =>
            setEntries((current) => [...current, initialDraft(timezone)])
          }
        >
          <Plus className="h-4 w-4" />
          Add entry
        </Button>
      </div>
      <div className="grid gap-3">
        {entries.map((entry, index) => {
          const session = automaticSession(
            instrument,
            date,
            entry.time,
            timezone,
          );
          return (
            <div key={index} className="surface p-3">
              <div className="mb-3 flex items-center justify-between">
                <strong className="text-sm text-study">
                  Entry {index + 1}
                </strong>
                <button
                  type="button"
                  aria-label={`Remove entry ${index + 1}`}
                  onClick={() =>
                    setEntries((current) =>
                      current.filter((_, position) => position !== index),
                    )
                  }
                  className="cursor-pointer text-muted transition hover:text-negative"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <Field label="Time">
                  <Input
                    type="time"
                    value={entry.time}
                    onChange={(event) =>
                      update(index, { time: event.target.value })
                    }
                    required
                  />
                </Field>
                <Field label="Session">
                  <span className="flex h-10 items-center text-sm font-semibold text-secondary">
                    {SESSION_LABELS[session]}
                  </span>
                </Field>
                <Field label="Direction">
                  <Select
                    value={entry.direction}
                    onChange={(event) =>
                      update(index, {
                        direction: event.target.value as Direction,
                      })
                    }
                  >
                    <option value="long">Long</option>
                    <option value="short">Short</option>
                  </Select>
                </Field>
                <Field label="RR">
                  <Select
                    value={entry.plannedRr}
                    onChange={(event) =>
                      update(index, { plannedRr: Number(event.target.value) })
                    }
                  >
                    {RR_PRESETS.map((value) => (
                      <option key={value} value={value}>
                        1:{value}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Realized R">
                  <Input
                    type="number"
                    step="0.1"
                    value={entry.realizedR}
                    onChange={(event) =>
                      update(index, { realizedR: Number(event.target.value) })
                    }
                    required
                  />
                </Field>
              </div>
            </div>
          );
        })}
        {!entries.length ? (
          <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted">
            No potential entries yet.
          </div>
        ) : null}
      </div>
    </section>
  );
}
