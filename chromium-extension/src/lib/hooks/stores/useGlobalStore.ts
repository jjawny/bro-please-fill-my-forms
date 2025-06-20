import { create } from "zustand";
import { TutorialStep, TutorialStepType, TutorialStepValues } from "~/lib/enums/TutorialStep";
import { err, ErrOr, ok } from "~/lib/models/ErrOr";
import { TutorialDataSchema } from "~/lib/models/TutorialData";
import { loadTutorialDataFromSyncStorage, saveToSyncStorage } from "~/lib/services/chrome-storage-sync-service";
import { logError } from "~/lib/utils/log-utils";

type TutorialProgress = Record<TutorialStepType, boolean>;

type GlobalStore = {
  isInitialized: boolean;
  globalError?: string;
  tutorialProgress: TutorialProgress;

  /**
   * Sets the state w any previously saved data
   */
  initialize: () => Promise<ErrOr>;

  /**
   * Signal to other UI that a global error has occurred
   */
  setGlobalError: (error?: string) => ErrOr;

  /**
   * Mark a tutorial step as completed
   */
  completeTutorialStep: (step: TutorialStepType) => Promise<ErrOr>;

  /**
   * Get the current (furthest) incomplete tutorial step
   */
  getCurrentTutorialStep: () => TutorialStepType | null;

  /**
   * Get a JSON dump of this store, render in <pre> tags for fast debugging/insights
   */
  GET_DEBUG_JSON_DUMP: () => string;
};

export const useGlobalStore = create<GlobalStore>((set, get) => ({
  isInitialized: false,
  globalError: undefined,
  tutorialProgress: {
    [TutorialStep.ENCRYPT_GEMINI_API_KEY]: false,
    [TutorialStep.ENTER_YOUR_PROMPT]: false,
    [TutorialStep.PRESS_GO]: false,
  },

  initialize: async (): Promise<ErrOr> => {
    let messages = ["Begin initializing GlobalStore"];

    try {
      set({ isInitialized: false });

      const loadTutorialDataResponse = await loadTutorialDataFromSyncStorage();

      messages = messages.concat(loadTutorialDataResponse.messages);

      if (!loadTutorialDataResponse.isOk) {
        return err({ messages, uiMessage: loadTutorialDataResponse.uiMessage, isAddUiMessageToMessages: false });
      }

      const currentStep = loadTutorialDataResponse.value.currentStep;
      const nextTutorialProgress: TutorialProgress = { ...get().tutorialProgress };

      // Mark all steps before the current step as completed
      for (let i = 0; i < TutorialStepValues.length; i++) {
        const currValue = TutorialStepValues[i];
        if (currValue === currentStep) {
          break;
        }
        nextTutorialProgress[currValue] = true;
      }

      set({
        isInitialized: true,
        tutorialProgress: { ...nextTutorialProgress },
      });

      return ok({ messages, uiMessage: "Successfully initialized GlobalStore" });
    } catch (error: unknown) {
      return err({ messages, uiMessage: logError(error, "Failed to initialize GlobalStore") });
    }
  },

  setGlobalError: (error?: string): ErrOr => {
    let messages = ["Begin setting globalError"];

    try {
      set({ globalError: error });
      return ok({ messages, uiMessage: "Successfully set globalError" });
    } catch (error: unknown) {
      return err({ messages, uiMessage: logError(error, "Failed to set globalError") });
    }
  },

  completeTutorialStep: async (step: TutorialStepType): Promise<ErrOr> => {
    let messages = [`Begin marking tutorial step '${step}' as complete`];

    try {
      set((state) => ({ tutorialProgress: { ...state.tutorialProgress, [step]: true } }));

      const saveToSessionStorageResponse = await saveToSyncStorage(TutorialDataSchema, {
        currentStep: get().getCurrentTutorialStep(),
      });

      messages = messages.concat(saveToSessionStorageResponse.messages);

      if (!saveToSessionStorageResponse.isOk) {
        return err({ messages, uiMessage: saveToSessionStorageResponse.uiMessage, isAddUiMessageToMessages: false });
      }

      return ok({ messages, uiMessage: `Successfully completed tutorial step '${step}'` });
    } catch (error: unknown) {
      return err({ messages, uiMessage: logError(error, `Failed to complete tutorial step '${step}'`) });
    }
  },

  getCurrentTutorialStep: (): TutorialStepType | null => {
    const { tutorialProgress } = get();
    const steps = Object.values(TutorialStep) as TutorialStepType[];

    // Find the first incomplete step in the tutorial sequence
    for (let i = 0; i < steps.length; i++) {
      if (!tutorialProgress[steps[i]]) {
        return steps[i];
      }
    }

    return null; // All steps completed
  },

  GET_DEBUG_JSON_DUMP: () => JSON.stringify(get(), null, 2),
}));
