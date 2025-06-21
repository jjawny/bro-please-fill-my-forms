import { err, ErrOr, ok } from "~/lib/models/ErrOr";
import { logError } from "~/lib/utils/log-utils";

/**
 * Notes:
 *  - Because we do not persist the PIN long-term, we need a way to validate the submitted PIN w/o the PIN
 *  - Successful validation = able to decrypt the API key + hash matches
 *  - If a user saves a blank API key, we still need a value to hash and decrypt later
 *  - This value should be random so it's useless to derive the PIN
 *  - The only known value is a separator so we can strip the prefix from the decrypted value
 *  - For simplicity, always add a random prefix before encrypted and always strip it later
 */
const DATA_PREFIX_SEPARATOR = "$$$";

/**
 * - Use the browser's native Crypto API (no ext deps)
 * - For security, derive a key from the PIN using PBKDF2 w SHA-256 hashing and 100,000 iterations
 * - For security, use AES-GCM for encryption which provides both confidentiality and authenticity
 * - For security, use a random salt and initialization vector (IV) for each encryption
 * - For storage, combine the salt, IV, and encrypted data into a single Base64-encoded string
 * - For tougher security, prepend a randomly generated prefix to the data before encryption (also handles empty data)
 */
export async function encryptData(data: string, pin: string): Promise<ErrOr<string>> {
  let messages = ["Begin encrypting data"];

  try {
    // 1. Prepend a randomly generated prefix (for tougher security + placeholder text to decrypt if data is empty)
    const prefixBytes = crypto.getRandomValues(new Uint8Array(16));
    const prefix = Array.from(prefixBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const dataWithPrefix = prefix + DATA_PREFIX_SEPARATOR + data;
    messages.push(`Added prefix: ${prefix}`);

    // 2. Encode and encrypt using AES-GCM
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(pin, salt);
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(dataWithPrefix));

    // 3. Combine salt, iv, and encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);
    const finalEncryptedData = btoa(String.fromCharCode(...combined));

    return ok({
      messages,
      uiMessage: `Successfully encrypted data ${JSON.stringify(finalEncryptedData)}`,
      value: finalEncryptedData,
    });
  } catch (error: unknown) {
    return err({ messages, uiMessage: logError(error, "Failed to encrypt data") });
  }
}

export async function decryptData(encryptedData: string, pin: string): Promise<ErrOr<string>> {
  let messages = ["Begin decrypting data"];

  try {
    // 1. Decode the base64
    const decoder = new TextDecoder();
    const binaryString = atob(encryptedData);
    const combined = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      combined[i] = binaryString.charCodeAt(i);
    }

    // 2. Extract salt, iv, and encrypted data
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);
    const key = await deriveKey(pin, salt);

    // 3. Decrypt using AES-GCM
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);
    const decryptedValue = decoder.decode(decrypted);

    // 4. Remove any randomly generated prefix
    const separatorIndex = decryptedValue.indexOf(DATA_PREFIX_SEPARATOR);
    const hasPrefix = separatorIndex !== -1;
    const cleanDecryptedData = hasPrefix
      ? decryptedValue.slice(separatorIndex + DATA_PREFIX_SEPARATOR.length)
      : decryptedValue;

    if (hasPrefix) messages.push(`Removed prefix: ${decryptedValue.slice(0, separatorIndex)}`);

    return ok({
      messages,
      uiMessage: `Successfully decrypted data ${JSON.stringify(cleanDecryptedData)}`,
      value: cleanDecryptedData,
    });
  } catch (error) {
    // Handle expected errors
    const isDecryptionFailed = error instanceof DOMException && error.name === "OperationError";

    if (isDecryptionFailed) {
      return err({ messages, uiMessage: "Invalid PIN" });
    }

    return err({ messages, uiMessage: logError(error, "Failed to decrypt data") });
  }
}

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(pin), { name: "PBKDF2" }, false, [
    "deriveKey",
  ]);
  const derivedKey = crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );

  return derivedKey;
}
