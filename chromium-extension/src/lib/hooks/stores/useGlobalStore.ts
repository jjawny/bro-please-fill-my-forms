import { create } from "zustand";
import { err, ErrOr, ok } from "~/lib/models/ErrOr";
import { logError } from "~/lib/utils/log-utils";

type GlobalStore = {
  globalError?: string;

  /**
   * Signal to other UI that a global error has occurred
   */
  setGlobalError: (error?: string) => ErrOr;
};

export const useGlobalStore = create<GlobalStore>((set) => ({
  globalError: undefined,

  setGlobalError: (error?: string): ErrOr => {
    let messages = ["Begin setting globalError"];

    try {
      set({ globalError: error });
      return ok({ messages, uiMessage: "Successfully set globalError" });
    } catch (error: unknown) {
      return err({ messages, uiMessage: logError(error, "Failed to set globalError") });
    }
  },
}));
