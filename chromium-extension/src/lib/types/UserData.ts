import { z } from "zod";
import { Theme, ThemeSchema } from "~/lib/enums/Theme";

export const UserDataSchema = z.object({
  theme: ThemeSchema,
  geminiApiKeyEncrypted: z.string().nullable(),
  geminiApiKeyHash: z.string().nullable(),
});

export type UserData = z.infer<typeof UserDataSchema>;

export const getDefaultUserData = (): UserData => {
  return {
    theme: Theme.system,
    geminiApiKeyEncrypted: null,
    geminiApiKeyHash: null,
  };
};
