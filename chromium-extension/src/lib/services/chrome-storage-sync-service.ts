import z, { ZodType } from "zod/v4";
import { ByoKeyData, ByoKeyDataSchema, getDefaultByoKeyData } from "~/lib/models/ByoKeyData";
import { err, ErrOr, ok } from "~/lib/models/OneOf";
import { getDefaultUserPreferences, UserPreferences, UserPreferencesSchema } from "~/lib/models/UserPreferences";
import { logError } from "~/lib/utils/log-utils";
import { convertUndefinedToNullOneLevelDeep } from "~/lib/utils/object-utils";

/**
 * Loads ByoKeyData from chrome.storage.sync
 */
export async function loadByoKeyDataFromSyncStorage(): Promise<ErrOr<ByoKeyData>> {
  let messages = ["Begin loading ByoKeyData from chrome.storage.sync"];

  try {
    if (import.meta.env.VITE_MOCK_CHROME_STORAGE_OPS_SUCCESSFUL === "true") {
      return ok({ messages, uiMessage: "[MOCKED] Successfully loaded ByoKeyData", value: getDefaultByoKeyData() });
    }

    const itemKeys: (keyof ByoKeyData)[] = [
      "geminiApiKeyEncrypted",
      "geminiApiKeyHash",
      "hasGeminiApiKeyConnectedSuccessfully",
    ];
    const items = await chrome.storage.sync.get(itemKeys);
    const byoKeyData: ByoKeyData = {
      geminiApiKeyEncrypted: items.geminiApiKeyEncrypted,
      geminiApiKeyHash: items.geminiApiKeyHash,
      hasGeminiApiKeyConnectedSuccessfully: items.hasGeminiApiKeyConnectedSuccessfully,
    };
    const validationResponse = ByoKeyDataSchema.safeParse(byoKeyData);

    // Fallback to defaults and attempt to heal corrupt data
    if (!validationResponse.success) {
      const defaults = getDefaultByoKeyData();
      await saveToSyncStorage(ByoKeyDataSchema, defaults);
      return ok({
        messages,
        uiMessage: `ByoKeyData failed validation, falling back to defaults: ${z.prettifyError(validationResponse.error)}`,
        value: defaults,
      });
    }

    return ok({
      messages,
      uiMessage: `Successfully loaded ${JSON.stringify(validationResponse.data)}`,
      value: validationResponse.data,
    });
  } catch (error: unknown) {
    return err({ messages, uiMessage: logError(error, "Failed to load ByoKeyData, failing back to defaults") });
  }
}

/**
 * Loads UserPreferences from chrome.storage.sync
 */
export async function loadUserPreferencesFromSyncStorage(): Promise<ErrOr<UserPreferences>> {
  let messages = ["Begin loading UserPreferences from chrome.storage.sync"];

  try {
    if (import.meta.env.VITE_MOCK_CHROME_STORAGE_OPS_SUCCESSFUL === "true") {
      return ok({
        messages,
        uiMessage: "[MOCKED] Successfully loaded UserPreferences",
        value: getDefaultUserPreferences(),
      });
    }

    const itemKeys: (keyof UserPreferences)[] = ["theme"];
    const items = await chrome.storage.sync.get(itemKeys);
    const userPreferences: UserPreferences = { theme: items.theme };
    const validationResponse = UserPreferencesSchema.safeParse(userPreferences);

    // Fallback to defaults and attempt to heal corrupt data
    if (!validationResponse.success) {
      const defaults = getDefaultUserPreferences();
      await saveToSyncStorage(UserPreferencesSchema, defaults);
      return ok({
        messages,
        uiMessage: `UserPreferences failed validation, falling back to defaults: ${z.prettifyError(validationResponse.error)}`,
        value: defaults,
      });
    }

    return ok({
      messages,
      uiMessage: `Successfully loaded ${JSON.stringify(validationResponse.data)}`,
      value: validationResponse.data,
    });
  } catch (error: unknown) {
    return err({ messages, uiMessage: logError(error, "Failed to load UserPreferences") });
  }
}

/**
 * Saves data for to live between multiple browser sessions
 * If the user is logged into Chrome, chrome.storage.sync will attempt to sync across devices
 * If the user is NOT logged into Chrome, this will behave like chrome.storage.local
 * Quota: 8KB per item, 100KB total
 */
export async function saveToSyncStorage<TSchema extends ZodType>(
  schema: TSchema,
  data: z.infer<TSchema>,
): Promise<ErrOr<z.infer<TSchema>>> {
  let messages = ["Begin saving to chrome.storage.sync"];

  try {
    if (import.meta.env.VITE_MOCK_CHROME_STORAGE_OPS_SUCCESSFUL === "true") {
      return ok({ messages, uiMessage: "[MOCKED] Successfully saved", value: data });
    }

    const validationResponse = schema.safeParse(data);

    if (!validationResponse.success) {
      return err({
        messages,
        uiMessage: `Unable to save as validation failed: ${z.prettifyError(validationResponse.error)}`,
      });
    }

    const validatedData = validationResponse.data;
    const cleanedData = convertUndefinedToNullOneLevelDeep<z.infer<TSchema>>(validatedData);

    await chrome.storage.sync.set(cleanedData);

    return ok({
      messages,
      uiMessage: `Successfully saved ${JSON.stringify(cleanedData)}`,
      value: cleanedData,
    });
  } catch (error: unknown) {
    return err({ messages, uiMessage: logError(error, "Failed to save") });
  }
}
