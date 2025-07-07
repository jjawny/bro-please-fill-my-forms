import { err, ErrOr, Messages, ok } from "~/lib/models/ErrOr";
import { logError } from "~/lib/utils/log-utils";

/**
 * ℹ️ Notes:
 *  - This is a speedrun app = zero/minimal-infra = client-side only
 *  - The sensitive data is the Gemini API key, which we need to protect
 *  - If the Gemini API key is short-lived in-mem only, this would be fine but a horrible UX
 *  - So we will persist the key in the browser's storage (extension storage, NOT web page storage)
 *  - The solution is to leverage CRX security features
 *
 * 🔒 Q&A for security concerns/vulns:
 *  - XSS? CRX popups run in isolation (separate mem-space)
 *  - What about sites that corrupt the content script return values? These values have a limited blast radius, values being
 *     [checking if operation was successful, scraped form fields for LLM-generation] which do not impact the sensitive data
 *  - CSP? Enforced by the browser, no ext scripts can be injected into a CRX popup, we do not fetch any external scripts at
 *     runtime (CDNs etc), everything is done at build (all deps are npm packages that we trust)
 *  - What about the data we send down to the current tab via content scripts? Sensitive data never reaches the web page,
 *     only the LLM generated data to inject (which the user is aware being sent to Google's LLMs anyway)
 *  - Where do we store the key? in the browser's sync storage, so the user can access it across sessions/devices
 *  - Do we store plaintext? No, we encrypt data w a PIN, a far better UX
 *  - How do we encrypt the data? Using AES-GCM to derive a key (these are battled-tested algos)
 *  - How do we confirm the key was decrypted successfully? Hash
 *  - But the user will need to enter the PIN every time? No, we store the PIN in session storage
 *     (short-lived, lost when browser closes), this means we auto-unlock the popup every time during the session
 *  - What if the user sets up a PIN but has no data to encrypt yet? We will use a randomly-gened placeholder value
 *     and a separator to remove later
 *  - Can other sites/CRXs access the browser storage space? No, the CRX browser storage is isolated per extension
 *  - OK but still, is this safe??? Yes, even w the source code public
 *
 * ⚠️ Future improvements:
 *  - Yes the user can choose PIN '1234', we can add PIN strength validation
 */
const DATA_PREFIX_SEPARATOR = "$$$";

export async function encryptData(data: string, pin: string): Promise<ErrOr<string>> {
  const messages: Messages = ["Begin encrypting data"];

  try {
    // 1. Prepend a randomly generated prefix (for tougher security + placeholder if data is empty)
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

    // 3. Combine salt, IV, and encrypted data into a single Base64-encoded string
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);
    const cipherText = btoa(String.fromCharCode(...combined));

    return ok({
      messages,
      uiMessage: `Successfully encrypted data ${JSON.stringify(cipherText)}`,
      value: cipherText,
    });
  } catch (error: unknown) {
    return err({ messages, uiMessage: logError(error, "Failed to encrypt data") });
  }
}

export async function decryptData(encryptedData: string, pin: string): Promise<ErrOr<string>> {
  const messages: Messages = ["Begin decrypting data"];

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
    // Expected error when decryption fails
    // const isDecryptionFailed = error instanceof DOMException && error.name === "OperationError";
    // To prevent timing attacks, always return the same failure message (and no error logs in PROD)
    const failureMessage = "Invalid PIN";

    if (import.meta.env.DEV) {
      logError(error, "Failed to decrypt data");
    }

    return err({ messages, uiMessage: failureMessage });
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
