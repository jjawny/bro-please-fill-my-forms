/**
 * Simple Descriminated Union Type (by checking isOk)
 * Messages for UI (toasts, helper text, etc) also acts as a slim stack trace
 *
 * FINDINGS/REALISATIONS when designing around ONE OFS functions:
 *  - Every function that's "Just My Code" should return a OneOf
 *     except for atomic functions that we don't expect to fail (helpers/utils)
 *     what's left are basically functions for biz logic/orchestration/using 3rd party libs more
 *  - ∴ our code outside of <Components/> are just a bunch of OneOf functions (a.k.a OneOfs)
 *
 *  - OneOfs should reduce decision-fatigue (always return the same type)
 *  - OneOfs should speed-up debugging; the type forces us to package errors as values and a quick way to check later (Go-lang inspired)
 *  - OneOfs should always merge messages from other OneOfs after calling (maintaining order)
 *  - OneOfs should not console.log/debug, because we already bundle messages across the entire stack trace of messages, the caller can decide to log/toast
 *  - OneOfs should not console.error expected errors (like failed decryption using nodeJS crypto lib) because...
 *  - OneOfs should always console.error UNEXPECTED errors when caught (as these are errors we need to fix)
 *  - OneOfs should never return nullish values, instead, fallback to <string, string> for the final success/error toast messages (like ErrOr status code)
 *
 *  - What are the entry points?
 *     99% of code execution/the stack trace will start from an event handlers/useEffect hooks/service workers (ignoring network-driven types; web sockets/SSE/polling)
 *     when we handle OneOfs in entry points, we console.debug/warn (not console.error as these errors are all handled)
 *
 *  - Why not new up a dedicated OneOf object?
 *     using the pure type (creating object literals) has better perf (less memory) just GPT "Performance of creating object literals from my OneOf type vs using a dedicated OneOf class"
 *     apparently 2-10x faster creation (CPU perf) and 20-30% less heap usage (MEM perf)
 *
 *  - Realised OneOfs are like heavy functions and for this app, all <Components/> call OneOfs via Zustand stores (which call more OneOfs down the stack trace)
 *  - Realised this starts to build a simple flow/map/visual of a React app like my ASP.NET Web API architecture
 */

// ORIGINAL
// export type OneOf<TValue, TError> =
//   | { isOk: true; value: TValue; messages: string[] }
//   | { isOk: false; error: TError; messages: string[] };

// #region UPGRADE?
// u shouldnt need to think or type much as this is used everywhere, so only TWO helper functions, ok and err, flexible
// TODO: confirm this? this is from the POV of us adding these to messages bundle, but maybe should be from the POV of the ui and we can easily just search, messages should be unique anyway failure ui messages should always start with "Failed to...", success ui messages should always start with "Successfully..."
// messages are for debugging (logging), <success/error>Message is for UI (toasts/helper text)
// success/error message got confusing when returning a bool (api key invalid but setting success message? idk man, lets call it uiMessage)
export type ErrOr<TValue = true> =
  | { isOk: true; value: TValue; messages: string[]; uiMessage: string }
  | { isOk: false; messages: string[]; uiMessage: string };

// Helper functions
/**
 * merges uimessage into messages and builds the return type quickly for u
 */
type CommonErrOrParams = {
  messages?: string[];
  uiMessage: string;
  // OPT-OUT (true by default) this saves 2 extra lines everywhere, assume true, and if we merge (return err using another ErrOrs uiMessage (less frequent) set to false), the 2 lines are newing the uimessage, then push manually everytime, and then assign, this way we can opt out of pushing etc here by default
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
    value: value ?? (true as any), // satisfies both ErrOr n ErrOr<T>, the caller will get type-safety from which signature they choose
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

//#region from TS playground
// type ErrOr<TValue = true> =
//   | { isOk: true; value: TValue, messages: string[], successMessage?: string }
//   | { isOk: false; messages: string[], errorMessage?: string };

// // Helper functions
// function ok<T>(value: T): ErrOr<T>;
// function ok(): ErrOr;
// function ok<T>(value?: T): any {
//   if (arguments.length === 0) {
//     return { isOk: true, value: true, messages: [], successMessage: undefined };
//   }
//   return { isOk: true, value: value, messages: [], successMessage: undefined };
// }

// function err<T = true>(): ErrOr<T> {
//   return { isOk: false, messages: [], errorMessage: undefined };
// }

// // Now this works
// const testFn = (): ErrOr => Math.random() > 0.5 ? ok() : err();
// const testFn2 = (): ErrOr<string> => Math.random() > 0.5 ? ok("here") : err();
// const testResponse = testFn();
// const testResponse2 = testFn2();

// // TEST
// if (testResponse.isOk) console.log(testResponse.value);
// else console.warn(testResponse.errorMessage);

// if (testResponse2.isOk) console.log(testResponse2.value)
// else console.warn(testResponse2.errorMessage);
//#endregion

/* EXAMPLE

function doWork(): OneOf<string, string> {
  let messages = ["Begin do work"];

  try {
    const doOtherWorkResponse = doOtherWork();

    messages = messages.concat(doOtherWorkResponse.messages);

    if (!doOtherWorkResponse.isOk) {
      const failMessage = "Failed to do work";
      messages.push(failMessage);
      return { isOk: false, error: failMessage, messages };
    }

    const otherWorkValue = doOtherWorkResponse.value;

    const uiMessage = "Successfully did work";
    messages.push(uiMessage);
    return { isOk: true, value: uiMessage, messages };
  } catch (error: unknown) {
    const uiMessage = logError(error, "Failed to do work");
    messages.push(uiMessage);
    return { isOk: false, error: uiMessage, messages };
  }
}

function doOtherWork(): OneOf<string, number> {
  return { isOk: false, error: 111111111, messages: ["Successfully did other work"] }
};

 */
