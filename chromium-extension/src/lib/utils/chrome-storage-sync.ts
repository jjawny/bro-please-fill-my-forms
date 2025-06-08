import z, { ZodError, ZodTypeAny } from "zod";
import { ByoKeyData, ByoKeyDataSchema, getDefaultByoKeyData } from "../types/ByoKeyData";
import { OneOf } from "../types/OneOf";
import { getDefaultUserPreferences, UserPreferences, UserPreferencesSchema } from "../types/UserPreferences";

/**
 * Notes:
 *  - 8kb per item, 100kb total
 *  - If the user is logged into Chrome, chrome.storage.sync will attempt to sync across devices
 *  - If the user is NOT logged into Chrome, this will behave like chrome.storage.local
 * @returns Previously saved UserData
 */
export async function safelyLoadByoKeyDataFromSyncStorage(): Promise<ByoKeyData> {
  try {
    const itemKeys: (keyof ByoKeyData)[] = ["geminiApiKeyEncrypted", "geminiApiKeyHash", "hasGeminiApiKeyConnectedSuccessfully"];
    const items = await chrome.storage.sync.get(itemKeys);
    const byoKeyData: ByoKeyData = {
      geminiApiKeyEncrypted: items.geminiApiKeyEncrypted,
      geminiApiKeyHash: items.geminiApiKeyHash,
      hasGeminiApiKeyConnectedSuccessfully: items.isGeminiApiKeyConnectedSuccessfully ?? false,
    };

    console.debug(`Loaded ByoKeyData from chrome.storage.sync`, byoKeyData);

    const validationResponse = ByoKeyDataSchema.safeParse(byoKeyData);

    // Fallback to defaults and attempt to heal corrupt data
    if (!validationResponse.success) {
      const defaults = getDefaultByoKeyData();
      await saveToSyncStorage(ByoKeyDataSchema, defaults);
      return defaults;
    }

    const validationData = validationResponse.data;
    return validationData;
  } catch (error: unknown) {
    console.error(`Failed to load ByoKeyData from chrome.storage.sync, reason ${error instanceof Error ? error.message : "Unknown"}`, error);
    return getDefaultByoKeyData();
  }
}

/**
 * @returns Previously saved UserPreferences
 */
export async function safelyLoadUserPreferencesFromSyncStorage(): Promise<UserPreferences> {
  try {
    const itemKeys: (keyof UserPreferences)[] = ["theme"];
    const items = await chrome.storage.sync.get(itemKeys);
    const userPreferences: UserPreferences = { theme: items.theme };

    console.debug(`Loaded UserPreferences from chrome.storage.sync`, userPreferences);

    const validationResponse = UserPreferencesSchema.safeParse(userPreferences);

    // Fallback to defaults and attempt to heal corrupt data
    if (!validationResponse.success) {
      const defaults = getDefaultUserPreferences();
      await saveToSyncStorage(UserPreferencesSchema, defaults);
      return defaults;
    }

    const validatedData = validationResponse.data;
    return validatedData;
  } catch (error: unknown) {
    console.error(`Failed to load UserPreferences from chrome.storage.sync, reason ${error instanceof Error ? error.message : "Unknown"}`, error);
    return getDefaultUserPreferences();
  }
}

/**
 * generic save to sync storage
 * @param schema
 * @param data
 * @returns
 */
export async function saveToSyncStorage<T extends ZodTypeAny>(schema: T, data: z.infer<T>): Promise<OneOf<T, ZodError<z.infer<T>> | string>> {
  try {
    const validationResponse = schema.safeParse(data);

    if (!validationResponse.success) {
      return { isOk: false, error: validationResponse.error };
    }

    const validatedData = validationResponse.data;

    await chrome.storage.sync.set(validatedData);

    return { isOk: true, value: validatedData };
  } catch (error: unknown) {
    console.error(
      `Failed to save '${JSON.stringify(data)}' to chrome.storage.sync, reason: ${error instanceof Error ? error.message : "Unknown"}`,
      error,
    );
    return { isOk: false, error: "Failed to save to chrome.storage.sync" };
  }
}
