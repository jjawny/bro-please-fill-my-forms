/**
 * Notes:
 *  - Because we do not persist the PIN long-term, we need a way to validate the submitted PIN w/o the PIN
 *  - Successful validation = able to decrypt the API key + hash matches
 *  - If a user saves a blank API key, we still need a value to hash and decrypt later
 *  - This value should be random so it's useless to derive the PIN
 *  - The only known value is a separator so we can strip the prefix from the decrypted value
 *  - For simplicity, always add a random prefix before encrypted and always strip it later
 */
export const API_KEY_PREFIX_SEPARATOR = "$$$";
