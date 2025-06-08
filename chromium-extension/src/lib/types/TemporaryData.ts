import { z } from "zod";

export const TemporaryDataSchema = z.object({ pin: z.string().nullish() });
export type TemporaryData = z.infer<typeof TemporaryDataSchema>;
export const getDefaultTemporaryData = (): TemporaryData => {
  return { pin: null };
};
