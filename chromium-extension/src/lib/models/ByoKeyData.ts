import { z } from "zod/v4";

export const ByoKeyDataSchema = z.object({
  geminiApiKeyEncrypted: z.string().nullable(),
  geminiApiKeyHash: z.string().nullable(),
  hasGeminiApiKeyConnectedSuccessfully: z.boolean().nullable(),
});
export type ByoKeyData = z.infer<typeof ByoKeyDataSchema>;
export const DEFAULT_BYO_KEY_DATA: ByoKeyData = {
  geminiApiKeyEncrypted: null,
  geminiApiKeyHash: null,
  hasGeminiApiKeyConnectedSuccessfully: null,
};
