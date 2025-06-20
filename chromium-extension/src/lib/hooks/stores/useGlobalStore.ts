import { create } from "zustand";
import { TutorialStep, TutorialStepType } from "~/lib/enums/TutorialStep";
import { err, ErrOr, ok } from "~/lib/models/ErrOr";
import { logError } from "~/lib/utils/log-utils";

type TutorialProgress = Record<TutorialStepType, boolean>;

type GlobalStore = {
  globalError?: string;
  tutorialProgress: TutorialProgress;

  /**
   * Signal to other UI that a global error has occurred
   */
  setGlobalError: (error?: string) => ErrOr;

  /**
   * Mark a tutorial step as completed
   */
  completeTutorialStep: (step: TutorialStepType) => ErrOr;

  /**
   * Get the current (furthest) incomplete tutorial step
   */
  getCurrentTutorialStep: () => TutorialStepType | undefined;
};

export const useGlobalStore = create<GlobalStore>((set, get) => ({
  globalError: undefined,
  tutorialProgress: {
    [TutorialStep.ENCRYPT_GEMINI_API_KEY]: false,
    [TutorialStep.ENTER_YOUR_PROMPT]: false,
    [TutorialStep.PRESS_GO]: false,
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

  completeTutorialStep: (step: TutorialStepType): ErrOr => {
    let messages = [`Begin marking tutorial step '${step}' as complete`];

    try {
      set((state) => ({ tutorialProgress: { ...state.tutorialProgress, [step]: true } }));
      return ok({ messages, uiMessage: `Successfully completed tutorial step '${step}'` });
    } catch (error: unknown) {
      return err({ messages, uiMessage: logError(error, `Failed to complete tutorial step '${step}'`) });
    }
  },

  getCurrentTutorialStep: (): TutorialStepType | undefined => {
    const { tutorialProgress } = get();
    const steps = Object.values(TutorialStep) as TutorialStepType[];

    // Find the first incomplete step in the tutorial sequence
    for (let i = 0; i < steps.length; i++) {
      if (!tutorialProgress[steps[i]]) {
        return steps[i];
      }
    }

    return undefined; // All steps completed
  },
}));
