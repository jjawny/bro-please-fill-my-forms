/**
 * Simple Descriminated Union Type (by checking isOk)
 * Messages for UI (toasts, helper text, etc) also acts as a slim stack trace
 *
 * General rules (WIP):
 *  - Every function that's "Just My Code" should return a OneOf
 *  - ∴ our code (outside of components) is just a bunch of OneOf functions (aka OneOfs)
 *  - OneOfs should reduce decision-fatigue (always return the same type)
 *  - OneOfs should speed-up debugging; the type forces us to package errors as values and a quick way to check later (Go-lang inspired)
 *  - OneOfs should always merge messages from other OneOfs (maintaining order)
 *  - OneOfs should not console.log/debug (because of messages, entry point can easily log/toast all)
 *  - OneOfs should not console.error expected errors (like failed decryption using nodeJS crypto lib)
 *  - OneOfs should always console.error unexpected errors when caught (as these are errors we need to fix)
 *  - If there's no values to return, typically we fallback to <string, string> for the final success/error toast messages
 *  - What are the entry points?
 *     99% of code execution/the stack trace will start from an event handlers/useEffect hooks/service workers (ignoring network-driven types; web sockets/SSE/polling)
 */
export type OneOf<TValue, TError> =
  | { isOk: true; value: TValue; messages: string[] }
  | { isOk: false; error: TError; messages: string[] };
