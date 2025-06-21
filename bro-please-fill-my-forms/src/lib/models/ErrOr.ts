export type ErrOr<TValue = true> =
  | { isOk: true; value: TValue; messages: Messages; uiMessage: string }
  | { isOk: false; messages: Messages; uiMessage: string };
export type Messages = (string | Messages)[];

// #region ErrOr helper functions
type CommonErrOrParams = {
  messages?: Messages;
  uiMessage: string;
  isAddUiMessageToMessages?: boolean; // opt-out; less common case
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
    value: value ?? (true as any),
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
