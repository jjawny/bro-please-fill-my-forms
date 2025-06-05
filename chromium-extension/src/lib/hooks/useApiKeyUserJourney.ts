import { useReducer } from "react";

export type ReducerState = {
  pin?: string;
  apiKey?: string;
  isPinSetup?: boolean;
  isUnlocked?: boolean;
};
export type UseApiKeyUserJourneyResponse = {
  state: ReducerState;
  setupPin: (pin: string) => void;
};

const ACTION = {
  SETUP_PIN: "SETUP_PIN",
  RESET_PIN: "RESET_PIN",
  SUBMIT_PIN: "SUBMIT_PIN",
  SUBMIT_API_KEY: "SUBMIT_API_KEY",
} as const;

export type ReducerAction =
  | {
      type: typeof ACTION.SETUP_PIN;
      payload: {
        pin: string;
      };
    }
  | {
      type: typeof ACTION.RESET_PIN;
    }
  | {
      type: typeof ACTION.SUBMIT_PIN;
      payload: {
        pin: string;
      };
    }
  | {
      type: typeof ACTION.SUBMIT_API_KEY;
      payload: {
        apiKey: string;
      };
    };

/**
 * This reducer centralises the different steps in a user's journey as they manage their API key.
 * Like a state machine
 * @param state the initial state
 * @param action the action to consume
 * @returns a reducer to use inside a `usseReducer` hook
 */
export function apiKeyUserJourneyReducer(
  state: ReducerState,
  action: ReducerAction
): ReducerState {
  switch (action.type) {
    case ACTION.SETUP_PIN:
      return {
        ...state,
        pin: action.payload.pin,
        isPinSetup: true,
      };
    case ACTION.RESET_PIN:
      return {
        ...state,
        pin: undefined,
        isPinSetup: false,
        apiKey: undefined,
      };
    case ACTION.SUBMIT_PIN:
      return {
        ...state,
        pin: action.payload.pin,
      };
    case ACTION.SUBMIT_API_KEY:
      return {
        ...state,
        apiKey: action.payload.apiKey,
      };
    default:
      return state;
  }
}

/**
 * the business logic wrapping the reducer to perform state changes (fetching state from other places, validating user state, etc)
 * @returns
 */
export function useApiKeyUserJourney(): UseApiKeyUserJourneyResponse {
  const [state, dispatch] = useReducer(apiKeyUserJourneyReducer, {
    pin: undefined,
    apiKey: undefined,
    isPinSetup: false,
    isUnlocked: false,
  });

  const setupPin = (pin: string) => {
    dispatch({ type: ACTION.SETUP_PIN, payload: { pin } });
  };

  return {
    state,
    setupPin,
  };
}
