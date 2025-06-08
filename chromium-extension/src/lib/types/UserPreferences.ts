import { z } from "zod";
import { Theme, ThemeSchema } from "~/lib/enums/Theme";

export const UserPreferencesSchema = z.object({ theme: ThemeSchema });
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export const getDefaultUserPreferences = (): UserPreferences => {
  return { theme: Theme.system };
};
