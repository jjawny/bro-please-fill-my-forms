import { ErrOr } from "~/lib/models/ErrOr";

const FALLBACK_ERROR_MESSAGE = "Unknown";

/**
 * Consistent way to log errors to console
 * Might be redundant; more useful if we have an external telemetry service
 */
export function logError(error: unknown, prefix?: string): string {
  const cleanErrorMessage = error instanceof Error ? (error.message ?? FALLBACK_ERROR_MESSAGE) : FALLBACK_ERROR_MESSAGE;
  const finalMessage =
    prefix?.trim() !== "" ? `${prefix}, reason: ${cleanErrorMessage}` : `Error: ${cleanErrorMessage}`;
  console.error(finalMessage, error);
  return finalMessage;
}

/**
 * Centralised way to log response objects (ErrOrs)
 */
export function logResponse<T>(response: ErrOr<T>): void {
  if (!response.isOk) {
    console.warn(response.uiMessage, response.messages);
    return;
  }

  if (import.meta.env.VITE_HIDE_DEBUG_LOGS === "false") {
    console.debug(response.uiMessage, response.messages);
    return;
  }
}
