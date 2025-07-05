import { create } from "zustand";
import { TutorialStep, TutorialStepType, TutorialStepValues } from "~/lib/enums/TutorialStep";
import { err, ErrOr, Messages, ok } from "~/lib/models/ErrOr";
import { TutorialDataSchema } from "~/lib/models/TutorialData";
import { loadTutorialDataFromSyncStorage, saveToSyncStorage } from "~/lib/services/chrome-storage-sync-service";
import { logError } from "~/lib/utils/log-utils";

type TutorialProgress = Record<TutorialStepType, boolean>;

type GlobalStore = {
  isInitialized: boolean;
  globalError?: string;
  tutorialProgress: TutorialProgress;
  currentTutorialStep?: TutorialStepType;

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
   * Get a dump of this store
   */
  GET_DEBUG_DUMP: () => object;
};

export const useGlobalStore = create<GlobalStore>((set, get) => ({
  isInitialized: false,
  globalError: undefined,
  tutorialProgress: {
    [TutorialStep.ENCRYPT_GEMINI_API_KEY]: false,
    [TutorialStep.ENTER_YOUR_PROMPT]: false,
    [TutorialStep.PRESS_GO]: false,
  },
  currentTutorialStep: TutorialStepValues[0],

  initialize: async (): Promise<ErrOr> => {
    let messages: Messages = ["Begin initializing GlobalStore"];

    try {
      set({ isInitialized: false });

      const loadTutorialDataResponse = await loadTutorialDataFromSyncStorage();

      messages.push(loadTutorialDataResponse.messages);

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
        currentTutorialStep: currentStep ?? undefined,
      });

      return ok({ messages, uiMessage: "Successfully initialized GlobalStore" });
    } catch (error: unknown) {
      return err({ messages, uiMessage: logError(error, "Failed to initialize GlobalStore") });
    }
  },

  setGlobalError: (error?: string): ErrOr => {
    let messages: Messages = ["Begin setting globalError"];

    try {
      set({ globalError: error });
      return ok({ messages, uiMessage: "Successfully set globalError" });
    } catch (error: unknown) {
      return err({ messages, uiMessage: logError(error, "Failed to set globalError") });
    }
  },

  completeTutorialStep: async (step: TutorialStepType): Promise<ErrOr> => {
    let messages: Messages = [`Begin marking tutorial step '${step}' as complete`];

    try {
      const currentTutorialStep = get().currentTutorialStep;
      const givenStepIndex = TutorialStepValues.indexOf(step);
      const nextData: TutorialProgress = { ...get().tutorialProgress };

      // Mark all steps prior to the given step as complete
      for (let i = 0; i < givenStepIndex; i++) {
        if (nextData[TutorialStepValues[i]] === false) {
          // Silently continue (using OK >>> err) as it's expected the user may try to interact w steps out-of-order (not an actual error)
          return ok({ messages, uiMessage: `Please complete prior step '${TutorialStepValues[i]}' first` });
        }
      }

      // Mark the given step as complete
      nextData[step] = true;

      // Only advance beyond the currentTutorialStep if we're completing that specific step
      let nextStep = currentTutorialStep;
      if (step === currentTutorialStep) {
        const nextStepValue = TutorialStepValues[givenStepIndex + 1];
        nextStep = nextStepValue ?? undefined;
      }

      // Save to storage to avoid repeating tutorial or losing progress
      const saveToSessionStorageResponse = await saveToSyncStorage(TutorialDataSchema, {
        currentStep: nextStep ?? null,
      });

      messages.push(saveToSessionStorageResponse.messages);

      if (!saveToSessionStorageResponse.isOk) {
        return err({ messages, uiMessage: saveToSessionStorageResponse.uiMessage, isAddUiMessageToMessages: false });
      }

      // Update state in-mem
      set({ tutorialProgress: nextData, currentTutorialStep: nextStep });

      return ok({ messages, uiMessage: `Successfully completed tutorial step '${step}'` });
    } catch (error: unknown) {
      return err({ messages, uiMessage: logError(error, `Failed to complete tutorial step '${step}'`) });
    }
  },

  GET_DEBUG_DUMP: () => ({ ...get() }),
}));
