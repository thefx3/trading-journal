import { z } from "zod";

const optionalNumber = z.preprocess((value) => value === "" || value == null ? null : value, z.coerce.number().nullable());
const optionalString = z.preprocess((value) => value === "" || value == null ? null : value, z.string().nullable());

export const tradeSchema = z.object({
  instrumentId: z.string().uuid("Select an instrument"),
  setupId: optionalString.pipe(z.string().uuid().nullable()),
  instrumentSymbol: z.string().min(1), journalMode: z.enum(["live", "study", "practice"]),
  setupFound: z.string().optional().transform((value) => value !== "false"),
  tradeDate: z.iso.date(), entryTime: optionalString,
  timezone: z.string().min(1), direction: optionalString.pipe(z.enum(["long", "short"]).nullable()),
  plannedRr: optionalNumber.pipe(z.number().positive().max(100).nullable()),
  result: optionalString.pipe(z.enum(["win", "loss", "be", "open"]).nullable()),
  realizedR: optionalNumber.pipe(z.number().min(-100).max(100).nullable()),
  session: z.enum(["asia", "london", "new_york_am", "new_york_lunch", "new_york_pm", "other"]),
  sessionOverride: z.string().optional().transform((value) => value === "true"), notes: z.string().max(10000).optional(),
}).superRefine((input, context) => {
  if (input.journalMode !== "study") {
    for (const field of ["entryTime", "direction", "plannedRr", "result", "realizedR"] as const) if (input[field] == null) context.addIssue({ code: "custom", path: [field], message: "Required for Live and Practice" });
  }
  if (input.journalMode === "study" && !input.setupFound && [input.direction, input.plannedRr, input.result, input.realizedR].some((value) => value != null)) context.addIssue({ code: "custom", path: ["setupFound"], message: "Execution fields must be empty when no setup was found" });
});

export const cropStateSchema = z.object({
  cropX: z.number().min(-200).max(200), cropY: z.number().min(-200).max(200),
  cropWidth: z.number().positive().max(100), cropHeight: z.number().positive().max(100),
  cropZoom: z.number().min(1).max(4), cropRotation: z.number().min(-180).max(180),
  aspectRatio: z.literal("4:3"),
});

export const imageMetaSchema = z.array(z.object({
  imageType: z.enum(["htf_analysis", "setup", "entry", "management", "exit", "other"]),
  timeframe: z.string().min(1).max(16),
  cropX: z.number().finite().default(0), cropY: z.number().finite().default(0),
  cropWidth: z.number().finite().default(100), cropHeight: z.number().finite().default(100),
  cropZoom: z.number().finite().default(1), cropRotation: z.number().finite().default(0),
  aspectRatio: z.literal("4:3").default("4:3"),
}).transform((crop) => ({ ...crop, cropX: Math.min(200, Math.max(-200, crop.cropX)), cropY: Math.min(200, Math.max(-200, crop.cropY)), cropWidth: 100, cropHeight: 100, cropZoom: Math.min(4, Math.max(1, crop.cropZoom)), cropRotation: Math.min(180, Math.max(-180, crop.cropRotation)) }))).max(6);

export const existingImageMetaSchema = z.array(z.object({ id: z.string().uuid() }).and(cropStateSchema)).max(6);

export const studyEntriesSchema = z.array(z.object({
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  session: z.enum(["asia", "london", "new_york_am", "new_york_lunch", "new_york_pm", "other"]),
  sessionOverride: z.boolean(), direction: z.enum(["long", "short"]),
  plannedRr: z.number().positive().max(100), result: z.enum(["win", "loss", "be", "open"]),
  realizedR: z.number().min(-100).max(100),
})).max(10);
