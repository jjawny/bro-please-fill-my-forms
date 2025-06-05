import { ZodError } from "zod";
import { OneOf } from "../types/OneOf";
import {
  getDefaultUserData,
  UserData,
  UserDataSchema,
} from "../types/UserData";

/**
 * Notes:
 *  - 8kb per item, 100kb total
 *  - If the user is logged into Chrome, chrome.storage.sync will attempt to sync across devices
 *  - If the user is NOT logged into Chrome, this will behave like chrome.storage.local
 * @returns Previously saved UserData
 */
export async function safelyLoadUserDataFromSyncStorage(): Promise<UserData> {
  try {
    const itemKeys: (keyof UserData)[] = [
      "theme",
      "geminiApiKeyEncrypted",
      "geminiApiKeyHash",
    ];
    const items = await chrome.storage.sync.get(itemKeys);

    let userData: UserData = {
      theme: items.theme,
      geminiApiKeyEncrypted: items.geminiApiKeyEncrypted,
      geminiApiKeyHash: items.geminiApiKeyHashed,
    };

    const validationResponse = UserDataSchema.safeParse(userData);

    if (!validationResponse.success) {
      userData = await healCorruptUserData();
    }

    return userData;
  } catch (ex: unknown) {
    console.error(`Error loading UserData from chrome.storage.sync`, ex);
    return getDefaultUserData();
  }
}

export const saveToSyncStorage = async (
  userData: Partial<UserData>
): Promise<OneOf<undefined, Error | ZodError<UserData>>> => {
  try {
    const validationResponse = UserDataSchema.safeParse(userData);

    if (!validationResponse.success) {
      return { isOk: false, error: validationResponse.error };
    }

    await chrome.storage.sync.set(validationResponse.data);

    return { isOk: true, value: undefined };
  } catch (ex: unknown) {
    const error =
      ex instanceof Error
        ? ex
        : new Error("Unknown error occurred when saving UserData");

    return { isOk: false, error: error };
  }
};

const healCorruptUserData = async (): Promise<UserData> => {
  const userData = getDefaultUserData();
  await saveToSyncStorage(userData);

  return userData;
};
