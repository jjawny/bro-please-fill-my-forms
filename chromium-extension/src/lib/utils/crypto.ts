import { API_KEY_PREFIX_SEPARATOR } from "~/lib/constants/globals";
import { OneOf } from "~/lib/types/OneOf";
import { logError } from "./console-helpers";

/**
 * 
 * TODO: clean up
I've successfully updated the component to use the native Web Crypto API instead of CryptoJS. The changes include:

Replaced CryptoJS with Web Crypto API: Using the browser's built-in crypto.subtle for encryption/decryption
Enhanced security: Implemented PBKDF2 key derivation with 100,000 iterations and SHA-256 hashing
AES-GCM encryption: Using AES-GCM which provides both confidentiality and authenticity
Proper salt and IV handling: Each encryption uses a random salt and initialization vector for security
Base64 encoding: Encoded the combined salt, IV, and encrypted data for storage
The native Web Crypto API provides better security, performance, and doesn't require external dependencies. The encryption process now uses industry-standard practices with proper key derivation and authenticated encryption.
 */
export async function encryptData(data: string, pin: string): Promise<OneOf<string, string>> {
  let messages = ["Begin encrypting data"];

  try {
    // 1. Prepend a randomly generated prefix (for tougher security + placeholder text to decrypt if data is empty)
    const prefixBytes = crypto.getRandomValues(new Uint8Array(16));
    const prefix = Array.from(prefixBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const dataWithPrefix = prefix + API_KEY_PREFIX_SEPARATOR + data;
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

    const successMessage = "Successfully encrypted data";
    messages.push(successMessage);
    return { isOk: true, value: finalEncryptedData, messages };
  } catch (error: unknown) {
    const errorMessage = logError(error, "Failed to encrypt data");
    messages.push(errorMessage);
    return { isOk: false, error: errorMessage, messages };
  }
}

export async function decryptData(encryptedData: string, pin: string): Promise<OneOf<string, string>> {
  let messages = ["Begin decrypting data"];

  try {
    // 1. Decode the base64
    const decoder = new TextDecoder();
    const combined = new Uint8Array(
      atob(encryptedData)
        .split("")
        .map((char) => char.charCodeAt(0)),
    );

    // 2. Extract salt, iv, and encrypted data
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);
    const key = await deriveKey(pin, salt);

    // 3. Decrypt using AES-GCM
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);
    const decryptedValue = decoder.decode(decrypted);

    // 4. Remove any randomly generated prefix
    const separatorIndex = decryptedValue.indexOf(API_KEY_PREFIX_SEPARATOR);
    const hasPrefix = separatorIndex !== -1;
    const originalData = hasPrefix
      ? decryptedValue.slice(separatorIndex + API_KEY_PREFIX_SEPARATOR.length)
      : decryptedValue;

    if (hasPrefix) messages.push(`Removed prefix: ${decryptedValue.slice(0, separatorIndex)}`);

    const successMessage = "Successfully decrypted data";
    messages.push(successMessage);
    return { isOk: true, value: originalData, messages };
  } catch (error) {
    // Handle expected errors
    const isDecryptionFailed = error instanceof DOMException && error.name === "InvalidAccessError";
    if (isDecryptionFailed) {
      const errorMessage = "Invalid PIN";
      messages.push(errorMessage);
      return { isOk: false, error: errorMessage, messages };
    }

    const errorMessage = logError(error, "Failed to decrypt data");
    messages.push(errorMessage);
    return { isOk: false, error: errorMessage, messages };
  }
}

export async function hash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return hash;
}

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(pin), { name: "PBKDF2" }, false, [
    "deriveKey",
  ]);
  const derivedKey = crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );

  return derivedKey;
}
