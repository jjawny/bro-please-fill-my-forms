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
 *
 *  - Why not new up a dedicated OneOf object?
 *     using the pure type (creating object literals) has better perf (less memory) just GPT "Performance of creating object literals from my OneOf type vs using a dedicated OneOf class"
 *     apparently 2-10x faster creation (CPU perf) and 20-30% less heap usage (MEM perf)
 *
 *  - Realised OneOfs are like heavy functions and for this app, all <Components/> call OneOfs via Zustand stores (which call more OneOfs down the stack trace)
 *  - Realised this starts to build a simple flow/map/visual of a React app like my ASP.NET Web API architecture
 */
export type OneOf<TValue, TError> =
  | { isOk: true; value: TValue; messages: string[] }
  | { isOk: false; error: TError; messages: string[] };

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

    const successMessage = "Successfully did work";
    messages.push(successMessage);
    return { isOk: true, value: successMessage, messages };
  } catch (error: unknown) {
    const errorMessage = logError(error, "Failed to do work");
    messages.push(errorMessage);
    return { isOk: false, error: errorMessage, messages };
  }
}

function doOtherWork(): OneOf<string, number> {
  return { isOk: false, error: 111111111, messages: ["Successfully did other work"] }
};

 */
