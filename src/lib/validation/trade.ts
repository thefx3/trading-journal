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
  setupValidity: optionalString.pipe(z.enum(["valid", "invalid"]).nullable()),
  executionQuality: optionalString.pipe(z.enum(["good", "bad"]).nullable()),
  tradeStatus: optionalString.pipe(z.enum(["taken", "missed"]).nullable()),
  theoreticalR: optionalNumber.pipe(z.number().min(-100).max(100).nullable()),
  executionError: optionalString.pipe(z.enum(["hesitation", "chase", "oversize", "early_entry", "late_entry", "extra_trade", "other"]).nullable()),
  session: z.enum(["asia", "london", "new_york_am", "new_york_lunch", "new_york_pm", "other"]),
  sessionOverride: z.string().optional().transform((value) => value === "true"), notes: z.string().max(10000).optional(),
}).superRefine((input, context) => {
  if (input.journalMode !== "study") {
    for (const field of ["entryTime", "direction", "plannedRr", "setupValidity", "executionQuality", "tradeStatus"] as const) if (input[field] == null) context.addIssue({ code: "custom", path: [field], message: "Required for Live and Practice" });
    if (input.tradeStatus === "taken" && (input.result == null || input.realizedR == null)) context.addIssue({ code: "custom", path: ["result"], message: "Result and Actual R are required for a taken trade" });
    if (input.tradeStatus === "missed" && input.theoreticalR == null) context.addIssue({ code: "custom", path: ["theoreticalR"], message: "Theoretical R is required for a missed setup" });
    if (input.tradeStatus === "missed" && input.executionQuality !== "bad") context.addIssue({ code: "custom", path: ["executionQuality"], message: "A missed setup is a bad execution" });
    if (input.tradeStatus === "missed" && input.setupValidity !== "valid") context.addIssue({ code: "custom", path: ["setupValidity"], message: "Only a valid setup can be missed" });
    if (input.setupValidity === "invalid" && input.executionQuality !== "bad") context.addIssue({ code: "custom", path: ["executionQuality"], message: "An invalid setup cannot be a good execution" });
    if (input.executionQuality === "bad" && input.executionError == null) context.addIssue({ code: "custom", path: ["executionError"], message: "Choose the primary execution error" });
    if (input.executionQuality === "good" && input.executionError != null) context.addIssue({ code: "custom", path: ["executionError"], message: "A good execution cannot have an execution error" });
  }
  if (input.journalMode === "study" && !input.setupFound && [input.direction, input.plannedRr, input.result, input.realizedR].some((value) => value != null)) context.addIssue({ code: "custom", path: ["setupFound"], message: "Execution fields must be empty when no setup was found" });
});

export const cropStateSchema = z.object({
  cropX: z.number().min(-200).max(200), cropY: z.number().min(-200).max(200),
  cropWidth: z.number().positive().max(100), cropHeight: z.number().positive().max(100),
  cropZoom: z.number().min(0.25).max(4), cropRotation: z.number().min(-180).max(180),
  aspectRatio: z.literal("4:3"),
});

export const imageMetaSchema = z.array(z.object({
  imageType: z.enum(["htf_analysis", "setup", "entry", "management", "exit", "other"]),
  timeframe: z.string().min(1).max(16),
  instrumentSymbol: z.string().min(1).max(24),
  capturePreset: z.enum(["standard", "wide"]),
  isComposed: z.boolean(),
  cropX: z.number().finite().default(0), cropY: z.number().finite().default(0),
  cropWidth: z.number().finite().default(100), cropHeight: z.number().finite().default(100),
  cropZoom: z.number().finite().default(1), cropRotation: z.number().finite().default(0),
  aspectRatio: z.literal("4:3").default("4:3"),
}).transform((crop) => ({ ...crop, cropX: Math.min(200, Math.max(-200, crop.cropX)), cropY: Math.min(200, Math.max(-200, crop.cropY)), cropWidth: 100, cropHeight: 100, cropZoom: Math.min(4, Math.max(0.25, crop.cropZoom)), cropRotation: Math.min(180, Math.max(-180, crop.cropRotation)) }))).max(6);

export const existingImageMetaSchema = z.array(z.object({ id: z.string().uuid() }).and(cropStateSchema)).max(6);

export const studyEntriesSchema = z.array(z.object({
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  session: z.enum(["asia", "london", "new_york_am", "new_york_lunch", "new_york_pm", "other"]),
  sessionOverride: z.boolean(), direction: z.enum(["long", "short"]),
  plannedRr: z.number().positive().max(100), result: z.enum(["win", "loss", "be", "open"]),
  realizedR: z.number().min(-100).max(100),
})).max(10);
