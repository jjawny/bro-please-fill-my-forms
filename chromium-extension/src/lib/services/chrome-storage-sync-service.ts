import z, { ZodError, ZodType } from "zod/v4";
import { ByoKeyData, ByoKeyDataSchema, getDefaultByoKeyData } from "~/lib/models/ByoKeyData";
import { OneOf } from "~/lib/models/OneOf";
import { getDefaultUserPreferences, UserPreferences, UserPreferencesSchema } from "~/lib/models/UserPreferences";
import { logError } from "~/lib/utils/log-utils";
import { convertUndefinedToNullOneLevelDeep } from "~/lib/utils/object-utils";

/**
 * Loads ByoKeyData from chrome.storage.sync
 */
export async function loadByoKeyDataFromSyncStorage(): Promise<OneOf<ByoKeyData, string>> {
  let messages = ["Begin loading ByoKeyData from chrome.storage.sync"];

  try {
    if (import.meta.env.VITE_MOCK_CHROME_STORAGE_OPS_SUCCESSFUL === "true") {
      messages.push("[MOCKED] Successfully loaded ByoKeyData");
      return { isOk: true, value: getDefaultByoKeyData(), messages };
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
      messages.push(
        `ByoKeyData failed validation, falling back to defaults: ${z.prettifyError(validationResponse.error)}`,
      );
      return { isOk: true, value: defaults, messages };
    }

    messages.push(`Successfully loaded ${JSON.stringify(validationResponse.data)}`);
    return { isOk: true, value: validationResponse.data, messages };
  } catch (error: unknown) {
    const errorMessage = logError(error, "Failed to load ByoKeyData, failing back to defaults");
    messages.push(errorMessage);
    return { isOk: false, error: errorMessage, messages };
  }
}

/**
 * Loads UserPreferences from chrome.storage.sync
 */
export async function loadUserPreferencesFromSyncStorage(): Promise<OneOf<UserPreferences, string>> {
  let messages = ["Begin loading UserPreferences from chrome.storage.sync"];

  try {
    if (import.meta.env.VITE_MOCK_CHROME_STORAGE_OPS_SUCCESSFUL === "true") {
      messages.push("[MOCKED] Successfully loaded UserPreferences");
      return { isOk: true, value: getDefaultUserPreferences(), messages };
    }

    const itemKeys: (keyof UserPreferences)[] = ["theme"];
    const items = await chrome.storage.sync.get(itemKeys);
    const userPreferences: UserPreferences = { theme: items.theme };
    const validationResponse = UserPreferencesSchema.safeParse(userPreferences);

    // Fallback to defaults and attempt to heal corrupt data
    if (!validationResponse.success) {
      const defaults = getDefaultUserPreferences();
      await saveToSyncStorage(UserPreferencesSchema, defaults);
      messages.push(
        `UserPreferences failed validation, falling back to defaults: ${z.prettifyError(validationResponse.error)}`,
      );
      return { isOk: true, value: defaults, messages };
    }

    messages.push(`Successfully loaded ${JSON.stringify(validationResponse.data)}`);
    return { isOk: true, value: validationResponse.data, messages };
  } catch (error: unknown) {
    const errorMessage = logError(error, "Failed to load UserPreferences");
    messages.push(errorMessage);
    return { isOk: false, error: errorMessage, messages };
  }
}

/**
 * Saves data for to live between multiple browser sessions
 * If the user is logged into Chrome, chrome.storage.sync will attempt to sync across devices
 * If the user is NOT logged into Chrome, this will behave like chrome.storage.local
 * Quota: 8KB per item, 100KB total
 */
export async function saveToSyncStorage<T extends ZodType>(
  schema: T,
  data: z.infer<T>,
): Promise<OneOf<T, ZodError<z.infer<T>> | string>> {
  let messages = ["Begin saving to chrome.storage.sync"];

  try {
    if (import.meta.env.VITE_MOCK_CHROME_STORAGE_OPS_SUCCESSFUL === "true") {
      messages.push("[MOCKED] Successfully saved");
      return { isOk: true, value: data, messages };
    }

    const validationResponse = schema.safeParse(data);

    if (!validationResponse.success) {
      messages.push(`Unable to save as validation failed: ${z.prettifyError(validationResponse.error)}`);
      return { isOk: false, error: validationResponse.error, messages };
    }

    const validatedData = validationResponse.data;
    const cleanedData = convertUndefinedToNullOneLevelDeep<T>(validatedData);

    await chrome.storage.sync.set(cleanedData);

    messages.push(`Successfully saved ${JSON.stringify(cleanedData)}`);
    return { isOk: true, value: cleanedData, messages };
  } catch (error: unknown) {
    const errorMessage = logError(error, "Failed to save");
    messages.push(errorMessage);
    return { isOk: false, error: errorMessage, messages };
  }
}
