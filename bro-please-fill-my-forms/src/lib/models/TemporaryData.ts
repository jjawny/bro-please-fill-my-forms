import { z } from "zod/v4";

export const TemporaryDataSchema = z.object({
  pin: z.string().nullable(),
  prompt: z.string().nullable(),
});
export type TemporaryData = z.infer<typeof TemporaryDataSchema>;
export const DEFAULT_TEMPORARY_DATA: TemporaryData = {
  pin: null,
  prompt: null,
};
