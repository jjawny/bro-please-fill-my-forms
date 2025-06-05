import { z } from "zod";

export const TemporaryUserDataSchema = z.object({
  pin: z.string().nullable(),
});

export type TemporaryUserData = z.infer<typeof TemporaryUserDataSchema>;

export const getDefaultTemporaryUserData = (): TemporaryUserData => {
  return {
    pin: null,
  };
};
