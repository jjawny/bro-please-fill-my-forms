import z, { ZodType } from "zod/v4";
import { err, ErrOr, ok } from "~/lib/models/ErrOr";
import { DEFAULT_TEMPORARY_DATA, TemporaryData, TemporaryDataSchema } from "~/lib/models/TemporaryData";
import { logError } from "~/lib/utils/log-utils";
import { convertUndefinedToNullOneLevelDeep } from "~/lib/utils/object-utils";

/**
 * Loads TemporaryData from chrome.storage.session
 */
export async function loadTemporaryDataFromSessionStorage(): Promise<ErrOr<TemporaryData>> {
  let messages = ["Begin loading TemporaryData from chrome.storage.session"];

  try {
    if (import.meta.env.DEV) {
      return ok({
        messages,
        uiMessage: "[MOCKED] Successfully loaded TemporaryData",
        value: DEFAULT_TEMPORARY_DATA,
      });
    }

    const itemKeys: (keyof TemporaryData)[] = ["pin", "prompt"];
    const items = await chrome.storage.session.get(itemKeys);
    const temporaryData: TemporaryData = { pin: items.pin, prompt: items.prompt };
    const validationResponse = TemporaryDataSchema.safeParse(temporaryData);

    // Fallback to defaults and attempt to heal corrupt data
    if (!validationResponse.success) {
      const defaults = DEFAULT_TEMPORARY_DATA;
      await saveToSessionStorage(TemporaryDataSchema, defaults);
      return ok({
        messages,
        uiMessage: `TemporaryData failed validation, falling back to defaults: ${z.prettifyError(validationResponse.error)}`,
        value: defaults,
      });
    }

    return ok({
      messages,
      uiMessage: `Successfully loaded ${JSON.stringify(validationResponse.data)}`,
      value: validationResponse.data,
    });
  } catch (error: unknown) {
    return err({ messages, uiMessage: logError(error, "Failed to load TemporaryData, failing back to defaults") });
  }
}

/**
 * Saves data for the lifetime of the browser session (shared between tabs)
 * Quota: 10MB total
 * Note: Google Chrome has a write rate-limit, debounce these function calls
 */
export async function saveToSessionStorage<T extends ZodType>(schema: T, data: z.infer<T>): Promise<ErrOr<z.infer<T>>> {
  let messages = ["Begin saving to chrome.storage.session"];

  try {
    if (import.meta.env.DEV) {
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
    const cleanedData = convertUndefinedToNullOneLevelDeep(validatedData);

    await chrome.storage.session.set(cleanedData);

    return ok({
      messages,
      uiMessage: `Successfully saved ${JSON.stringify(cleanedData)}`,
      value: cleanedData,
    });
  } catch (error: unknown) {
    return err({ messages, uiMessage: logError(error, "Failed to save") });
  }
}
