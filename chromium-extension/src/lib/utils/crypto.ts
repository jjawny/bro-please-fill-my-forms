import { API_KEY_PREFIX_SEPARATOR } from "../constants/globals";
import { OneOf } from "../types/OneOf";

/**
 * 
I've successfully updated the component to use the native Web Crypto API instead of CryptoJS. The changes include:

Replaced CryptoJS with Web Crypto API: Using the browser's built-in crypto.subtle for encryption/decryption
Enhanced security: Implemented PBKDF2 key derivation with 100,000 iterations and SHA-256 hashing
AES-GCM encryption: Using AES-GCM which provides both confidentiality and authenticity
Proper salt and IV handling: Each encryption uses a random salt and initialization vector for security
Base64 encoding: Encoded the combined salt, IV, and encrypted data for storage
The native Web Crypto API provides better security, performance, and doesn't require external dependencies. The encryption process now uses industry-standard practices with proper key derivation and authenticated encryption.
 * @param data 
 * 
 * @param pin 
 * @returns 
 */
export const encryptData = async (data: string, pin: string): Promise<string> => {
  const encoder = new TextEncoder();

  //region
  const prefixBytes = crypto.getRandomValues(new Uint8Array(16));
  const prefix = Array.from(prefixBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Prepend the prefix to the data
  const dataWithPrefix = prefix + API_KEY_PREFIX_SEPARATOR + data;
  //endregion

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);

  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(dataWithPrefix));

  // Combine salt, iv, and encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined));
};

export const decryptData = async (encryptedData: string, pin: string): Promise<OneOf<string, string>> => {
  try {
    const decoder = new TextDecoder();
    const combined = new Uint8Array(
      atob(encryptedData)
        .split("")
        .map((char) => char.charCodeAt(0)),
    );
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);
    const key = await deriveKey(pin, salt);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);
    const decryptedValue = decoder.decode(decrypted);

    //region
    // attempt to strip the prefix
    const separatorIndex = decryptedValue.indexOf(API_KEY_PREFIX_SEPARATOR);
    const originalData = separatorIndex !== -1 ? decryptedValue.slice(separatorIndex + API_KEY_PREFIX_SEPARATOR.length) : decryptedValue;
    //endregion

    return { isOk: true, value: originalData };
  } catch (error) {
    var errorMessage = `Decryption failed, reason: ${error instanceof Error ? error.message : String(error)}`;
    return { isOk: false, error: errorMessage };
  }
};

// Utility functions for encryption/decryption using Web Crypto API
const deriveKey = async (pin: string, salt: Uint8Array): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(pin), { name: "PBKDF2" }, false, ["deriveKey"]);

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
};

export const hash = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};
