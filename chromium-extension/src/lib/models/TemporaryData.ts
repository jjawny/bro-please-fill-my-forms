import { z } from "zod/v4";

export const TemporaryDataSchema = z.object({
  pin: z.string().nullable(),
  prompt: z.string().nullable(),
});
export type TemporaryData = z.infer<typeof TemporaryDataSchema>;
export const getDefaultTemporaryData = (): TemporaryData => {
  return {
    pin: null,
    prompt: null,
  };
};
