// Simple Discriminated Union Type (by checking isOk)
// Optional message for UI (toasts, helper text, etc)
export type OneOf<TValue, TError> =
  | { isOk: true; value: TValue; message?: string }
  | { isOk: false; error: TError; message?: string };
