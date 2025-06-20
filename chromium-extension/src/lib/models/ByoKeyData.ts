import { z } from "zod/v4";

export const ByoKeyDataSchema = z.object({
  geminiApiKeyEncrypted: z.string().nullable(),
  geminiApiKeyHash: z.string().nullable(),
  hasGeminiApiKeyConnectedSuccessfully: z.boolean().nullable(),
});
export type ByoKeyData = z.infer<typeof ByoKeyDataSchema>;
export const getDefaultByoKeyData = (): ByoKeyData => {
  return {
    geminiApiKeyEncrypted: null,
    geminiApiKeyHash: null,
    hasGeminiApiKeyConnectedSuccessfully: null,
  };
};
