import { z } from "zod";

export const ByoKeyDataSchema = z.object({
  geminiApiKeyEncrypted: z.string().nullish(),
  geminiApiKeyHash: z.string().nullish(),
  hasGeminiApiKeyConnectedSuccessfully: z.boolean().nullish(),
});
export type ByoKeyData = z.infer<typeof ByoKeyDataSchema>;
export const getDefaultByoKeyData = (): ByoKeyData => {
  return {
    geminiApiKeyEncrypted: null,
    geminiApiKeyHash: null,
    hasGeminiApiKeyConnectedSuccessfully: false,
  };
};
