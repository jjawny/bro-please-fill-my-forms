import { ZodError } from "zod";
import { OneOf } from "../types/OneOf";
import {
  getDefaultTemporaryUserData,
  TemporaryUserData,
  TemporaryUserDataSchema,
} from "../types/TemporaryData";

/**
 * Notes:
 *  - Data stored for the lifetime of the browser session (shared between tabs)
 * @returns Temporarily saved UserData
 */
export const loadFromSessionStorage = async (): Promise<TemporaryUserData> => {
  try {
    const keys: (keyof TemporaryUserData)[] = ["pin"];
    const items = await chrome.storage.session.get(keys);

    let temporaryUserData: TemporaryUserData = {
      pin: items.pin,
    };

    const validationResponse =
      TemporaryUserDataSchema.safeParse(temporaryUserData);

    if (!validationResponse.success) {
      temporaryUserData = await healCorruptTemporaryUserData();
    }

    return temporaryUserData;
  } catch (ex: unknown) {
    console.error(`Error loading UserData from chrome.storage.sync`, ex);
    return getDefaultTemporaryUserData();
  }
};

export const saveToSessionStorage = async (
  temporaryUserData: Partial<TemporaryUserData>
): Promise<OneOf<undefined, Error | ZodError<TemporaryUserData>>> => {
  try {
    const validationResponse =
      TemporaryUserDataSchema.safeParse(temporaryUserData);

    if (!validationResponse.success) {
      return { isOk: false, error: validationResponse.error };
    }

    await chrome.storage.session.set(validationResponse.data);

    return { isOk: true, value: undefined };
  } catch (ex: unknown) {
    return {
      isOk: false,
      error:
        ex instanceof Error
          ? ex
          : new Error("Unknown error occurred when saving TemporaryUserData"),
    };
  }
};

const healCorruptTemporaryUserData = async (): Promise<TemporaryUserData> => {
  const temporaryUserData = getDefaultTemporaryUserData();
  await saveToSessionStorage(temporaryUserData);

  return temporaryUserData;
};
