import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (value === "" || value == null ? null : value),
  z.string().nullable(),
);
const requiredNumber = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.coerce.number(),
);

export const tradeSchema = z
  .object({
    instrumentId: z.string().uuid("Select an instrument"),
    instrumentSymbol: z.string().min(1),
    journalMode: z.enum(["live", "study", "practice"]),
    tradeDate: z.iso.date(),
    timezone: z.string().min(1),
    direction: z.enum(["long", "short"]),
    realizedR: requiredNumber.pipe(z.number().min(-100).max(100)),
    setupValidity: z.enum(["valid", "invalid"]),
    executionQuality: z.enum(["good", "bad"]),
    tradeStatus: z.enum(["taken", "missed"]),
    executionError: optionalString.pipe(
      z
        .enum([
          "hesitation",
          "chase",
          "oversize",
          "early_entry",
          "late_entry",
          "extra_trade",
          "other",
        ])
        .nullable(),
    ),
    session: z.enum([
      "asia",
      "london",
      "new_york_am",
      "new_york_lunch",
      "new_york_pm",
      "other",
    ]),
    notes: z.string().max(10000).optional(),
  })
  .superRefine((input, context) => {
    if (input.tradeStatus === "missed" && input.executionQuality !== "bad")
      context.addIssue({
        code: "custom",
        path: ["executionQuality"],
        message: "A missed trade is a bad execution",
      });
    if (input.tradeStatus === "missed" && input.setupValidity !== "valid")
      context.addIssue({
        code: "custom",
        path: ["setupValidity"],
        message: "Only a valid opportunity can be missed",
      });
    if (input.setupValidity === "invalid" && input.executionQuality !== "bad")
      context.addIssue({
        code: "custom",
        path: ["executionQuality"],
        message: "An invalid opportunity cannot be a good execution",
      });
    if (input.executionQuality === "bad" && input.executionError == null)
      context.addIssue({
        code: "custom",
        path: ["executionError"],
        message: "Choose the primary execution error",
      });
    if (input.executionQuality === "good" && input.executionError != null)
      context.addIssue({
        code: "custom",
        path: ["executionError"],
        message: "A good execution cannot have an execution error",
      });
  });

export const cropStateSchema = z.object({
  cropX: z.number().min(-200).max(200),
  cropY: z.number().min(-200).max(200),
  cropWidth: z.number().positive().max(100),
  cropHeight: z.number().positive().max(100),
  cropZoom: z.number().min(0.25).max(4),
  cropRotation: z.number().min(-180).max(180),
  aspectRatio: z.literal("4:3"),
});

export const imageMetaSchema = z
  .array(
    z
      .object({
        imageType: z.enum([
          "htf_analysis",
          "setup",
          "entry",
          "management",
          "exit",
          "other",
        ]),
        timeframe: z.string().min(1).max(16),
        instrumentSymbol: z.string().min(1).max(24),
        capturePreset: z.enum(["standard", "wide"]),
        isComposed: z.boolean(),
        cropX: z.number().finite().default(0),
        cropY: z.number().finite().default(0),
        cropWidth: z.number().finite().default(100),
        cropHeight: z.number().finite().default(100),
        cropZoom: z.number().finite().default(1),
        cropRotation: z.number().finite().default(0),
        aspectRatio: z.literal("4:3").default("4:3"),
      })
      .transform((crop) => ({
        ...crop,
        cropX: Math.min(200, Math.max(-200, crop.cropX)),
        cropY: Math.min(200, Math.max(-200, crop.cropY)),
        cropWidth: 100,
        cropHeight: 100,
        cropZoom: Math.min(4, Math.max(0.25, crop.cropZoom)),
        cropRotation: Math.min(180, Math.max(-180, crop.cropRotation)),
      })),
  )
  .max(6);

export const existingImageMetaSchema = z
  .array(z.object({ id: z.string().uuid() }).and(cropStateSchema))
  .max(6);
