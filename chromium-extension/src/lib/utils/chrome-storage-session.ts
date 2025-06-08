import z, { ZodError, ZodTypeAny } from "zod";
import { OneOf } from "../types/OneOf";
import { getDefaultTemporaryData, TemporaryData, TemporaryDataSchema } from "../types/TemporaryData";

/**
 * Notes:
 *  - Data stored for the lifetime of the browser session (shared between tabs)
 * @returns Temporarily saved UserData
 */
export async function safelyLoadTemporaryDataFromSessionStorage(): Promise<TemporaryData> {
  try {
    const itemKeys: (keyof TemporaryData)[] = ["pin"];
    const items = await chrome.storage.session.get(itemKeys);
    const temporaryData: TemporaryData = { pin: items.pin };

    console.debug(`Loaded TemporaryData from chrome.storage.session`, temporaryData);

    const validationResponse = TemporaryDataSchema.safeParse(temporaryData);

    if (!validationResponse.success) {
      const defaults = getDefaultTemporaryData();
      await saveToSessionStorage(TemporaryDataSchema, defaults);
      return defaults;
    }

    const validatedData = validationResponse.data;
    return validatedData;
  } catch (error: unknown) {
    console.error(`Failed to load TemporaryData from chrome.storage.session, reason ${error instanceof Error ? error.message : "Unknown"}`, error);
    return getDefaultTemporaryData();
  }
}

export async function saveToSessionStorage<T extends ZodTypeAny>(schema: T, data: z.infer<T>): Promise<OneOf<T, ZodError<z.infer<T>> | string>> {
  try {
    const validationResponse = schema.safeParse(data);

    if (!validationResponse.success) {
      return { isOk: false, error: validationResponse.error };
    }

    const validatedData = validationResponse.data;

    await chrome.storage.session.set(validatedData);

    return { isOk: true, value: validatedData };
  } catch (error: unknown) {
    console.error(
      `Failed to save '${JSON.stringify(data)}' to chrome.storage.session, reason: ${error instanceof Error ? error.message : "Unknown"}`,
      error,
    );
    return { isOk: false, error: "Failed to save to chrome.storage.session" };
  }
}
