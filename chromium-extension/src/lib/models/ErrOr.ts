/**
 * Simple 'Errors as Values' by checking isOk
 * Unlike ASP.NET version, HTTP code is replaced w a UI message (final definitive value; use in toasts, helper text, etc)
 * Because messages are for debugging, enhance them to allow nesting to build a true slim stack trace
 *
 * FINDINGS/REALISATIONS when designing around ErrOr functions on frontends:
 *  - Every function that's "Just My Code" should return a ErrOr
 *     except for atomic functions that we don't expect to fail (helpers/utils)
 *     what's left are basically functions for biz logic/orchestration/using 3rd party libs more
 *  - ∴ our code outside of <Components/> are just a bunch of ErrOr functions (a.k.a ErrOrs)
 *
 *  - ErrOrs should reduce decision-fatigue (always return the same type)
 *  - ErrOrs should speed-up debugging; the type forces us to package errors as values and a quick way to check later (Go-lang inspired)
 *  - ErrOrs should always merge messages from other ErrOrs after calling (maintaining order)
 *  - ErrOrs should not console.log/debug, because we already bundle messages across the entire stack trace of messages, the caller can decide to log/toast
 *  - ErrOrs should not console.error expected errors (like failed decryption using nodeJS crypto lib) because...
 *  - ErrOrs should always console.error UNEXPECTED errors when caught (as these are errors we need to fix)
 *
 *  - What are the entry points?
 *     99% of code execution/the stack trace will start from an event handlers/useEffect hooks/service workers (ignoring network-driven types; web sockets/SSE/polling)
 *     when we handle ErrOrs in entry points, we console.debug/warn (not console.error as these errors are all handled)
 *
 *  - Why not new up a dedicated ErrOr object?
 *     using the pure type (creating object literals) has better perf (less memory) just GPT "Performance of creating object literals from my ErrOr type vs using a dedicated ErrOr class"
 *     apparently 2-10x faster creation (CPU perf) and 20-30% less heap usage (MEM perf)
 *
 *  - Realised ErrOrs are like heavy functions and for this app, all <Components/> call ErrOrs via Zustand stores (which call more ErrOrs down the stack trace)
 *  - Realised this starts to build a simple flow/map/visual of a React app like my ASP.NET Web API architecture
 */

// #region OneOf (original idea)
// export type OneOf<TValue, TError> =
//   | { isOk: true; value: TValue; messages: string[] }
//   | { isOk: false; error: TError; messages: string[] };
// #endregion

// #region ErrOr
export type ErrOr<TValue = true> =
  | { isOk: true; value: TValue; messages: Messages; uiMessage: string }
  | { isOk: false; messages: Messages; uiMessage: string };
export type Messages = (string | Messages)[];
// #endregion

// #region Helper functions
type CommonErrOrParams = {
  messages?: Messages;
  uiMessage: string;
  // OPT-OUT (true by default)
  // This saves 2 extra lines everywhere we bubble-up another ErrOr response
  // These 2 lines would be `const uiMessage = ...` and then pushing to messages (to make sure uiMessage is included in-case the caller decides to use a different uiMessage)
  // The savings come from auto-adding uiMessage to messages during `ok` fn call
  // Issue is if we bubble-up the same uiMessage, this will be added again (duplicates)
  // For perf (avoiding a .includes check) and to keep predictable fn behaviour/output, expose a flag param to opt-out of this behaviour
  // TLDR if we bubble-up another error response w the SAME uiMessage, opt-out (false)
  isAddUiMessageToMessages?: boolean;
};

export function ok(): ErrOr;
export function ok(params: CommonErrOrParams): ErrOr;
export function ok<T>(params: { value: T } & CommonErrOrParams): ErrOr<T>;
export function ok<T>(params?: { value?: T } & CommonErrOrParams): ErrOr | ErrOr<T> {
  if (!params) {
    return { isOk: true, value: true, messages: [], uiMessage: "Success" };
  }

  const { value, messages = [], uiMessage, isAddUiMessageToMessages = true } = params;

  if (isAddUiMessageToMessages && uiMessage) {
    messages.push(uiMessage);
  }

  return {
    isOk: true,
    value: value ?? (true as any), // Satisfies both ErrOr n ErrOr<T>, the caller will get type-safety from which 'ok' fn signature they choose
    messages,
    uiMessage,
  };
}

export function err<T = true>(params?: CommonErrOrParams): ErrOr<T> {
  if (!params) {
    return { isOk: false, messages: [], uiMessage: "Failed" };
  }

  const { messages = [], uiMessage, isAddUiMessageToMessages = true } = params;

  if (isAddUiMessageToMessages && uiMessage) {
    messages.push(uiMessage);
  }

  return {
    isOk: false,
    messages,
    uiMessage,
  };
}
//#endregion

//#region Copy into TS Playground to RnD
// // Fallback to 'true' as the value if no generic given
// type ErrOr<TValue = true> =
//   | { isOk: true; value: TValue }
//   | { isOk: false; };

// // Helper functions
// function ok(): ErrOr;
// function ok<T>(value: T): ErrOr<T>;
// function ok<T>(value?: T): ErrOr | ErrOr<T> {
//   if (arguments.length === 0) {
//     return { isOk: true, value: true };
//   }
//   return { isOk: true, value: value ?? (true as any) };
// }

// function err<T = true>(): ErrOr<T> {
//   return { isOk: false };
// }

// // Console.log
// const testFnResponse = ((): ErrOr => Math.random() > 0.5 ? ok() : err())();
// const testFnResponse2 = ((): ErrOr<string> => Math.random() > 0.5 ? ok("here") : err())();

// if (testFnResponse.isOk) console.log("1 ok + value is true?", testFnResponse.value);
// else console.warn("1 ok?", testFnResponse.isOk);
// if (testFnResponse2.isOk) console.log("2 ok + value is 'here'?", testFnResponse2.value)
// else console.warn("2 ok?", testFnResponse2.isOk);
//#endregion

//#region EXAMPLE USAGE
// function doWork(): ErrOr<string> {
//   let messages: Messages = ["Begin do work"];

//   try {
//     const doOtherWorkResponse = doOtherWork();

//     messages.push(doOtherWorkResponse.messages);

//     if (!doOtherWorkResponse.isOk) {
//       return err({ messages, uiMessage: doOtherWorkResponse.uiMessage, isAddUiMessageToMessages: false });
//     }

//     const otherWorkValue = doOtherWorkResponse.value;

//     return ok({ messages, uiMessage: "Successfully did work", value: otherWorkValue.toString() });
//   } catch (error: unknown) {
//     return err({ messages, uiMessage: logError(error, "Failed to do work") });
//   }
// }

// function doOtherWork(): ErrOr<number> {
//   let messages: Messages = ["Begin do other work"];
//   return ok({ messages, uiMessage: "Successfully did other work", value: 69 });
// }
//#endregion
