export const encryptData = async (
  data: string,
  pin: string
): Promise<string> => {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(data)
  );

  // Combine salt, iv, and encrypted data
  const combined = new Uint8Array(
    salt.length + iv.length + encrypted.byteLength
  );
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined));
};

export const decryptData = async (
  encryptedData: string,
  pin: string
): Promise<string> => {
  const decoder = new TextDecoder();
  const combined = new Uint8Array(
    atob(encryptedData)
      .split("")
      .map((char) => char.charCodeAt(0))
  );

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const encrypted = combined.slice(28);

  const key = await deriveKey(pin, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );

  return decoder.decode(decrypted);
};

// Utility functions for encryption/decryption using Web Crypto API
const deriveKey = async (pin: string, salt: Uint8Array): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

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
    ["encrypt", "decrypt"]
  );
};
