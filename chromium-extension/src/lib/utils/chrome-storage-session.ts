import z, { ZodError, ZodType } from "zod/v4";
import { OneOf } from "~/lib/types/OneOf";
import { getDefaultTemporaryData, TemporaryData, TemporaryDataSchema } from "~/lib/types/TemporaryData";
import { logError } from "./console-helpers";
import { convertUndefinedToNullOneLevelDeep } from "./object-helpers";

/**
 * Loads TemporaryData from chrome.storage.session
 */
export async function loadTemporaryDataFromSessionStorage(): Promise<OneOf<TemporaryData, string>> {
  let messages = ["Begin loading TemporaryData from chrome.storage.session"];

  try {
    if (import.meta.env.VITE_MOCK_CHROME_STORAGE_OPS_SUCCESSFUL === "true") {
      messages.push("[MOCKED] Successfully loaded TemporaryData");
      return { isOk: true, value: getDefaultTemporaryData(), messages };
    }

    const itemKeys: (keyof TemporaryData)[] = ["pin"];
    const items = await chrome.storage.session.get(itemKeys);
    const temporaryData: TemporaryData = { pin: items.pin };
    const validationResponse = TemporaryDataSchema.safeParse(temporaryData);

    // Fallback to defaults and attempt to heal corrupt data
    if (!validationResponse.success) {
      const defaults = getDefaultTemporaryData();
      await saveToSessionStorage(TemporaryDataSchema, defaults);
      messages.push(
        `TemporaryData failed validation, falling back to defaults: ${z.prettifyError(validationResponse.error)}`,
      );
      return { isOk: true, value: defaults, messages };
    }

    messages.push(`Successfully loaded ${JSON.stringify(validationResponse.data)}`);
    return { isOk: true, value: validationResponse.data, messages };
  } catch (error: unknown) {
    const errorMessage = logError(error, "Failed to load TemporaryData, failing back to defaults");
    messages.push(errorMessage);
    return { isOk: false, error: errorMessage, messages };
  }
}

/**
 * Saves data for the lifetime of the browser session (shared between tabs)
 * Quota: 10MB total
 */
export async function saveToSessionStorage<T extends ZodType>(
  schema: T,
  data: z.infer<T>,
): Promise<OneOf<T, ZodError<z.infer<T>> | string>> {
  let messages = ["Begin saving to chrome.storage.session"];

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
    const cleanedData = convertUndefinedToNullOneLevelDeep(validatedData);

    await chrome.storage.session.set(cleanedData);

    messages.push(`Successfully saved ${JSON.stringify(cleanedData)}`);
    return { isOk: true, value: cleanedData, messages };
  } catch (error: unknown) {
    const errorMessage = logError(error, "Failed to save");
    messages.push(errorMessage);
    return { isOk: false, error: errorMessage, messages };
  }
}
