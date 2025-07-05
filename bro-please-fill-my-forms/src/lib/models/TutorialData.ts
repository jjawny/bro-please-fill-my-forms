import { z } from "zod/v4";
import { TutorialStep, TutorialStepSchema } from "~/lib/enums/TutorialStep";

export const TutorialDataSchema = z.object({
  currentStep: TutorialStepSchema.nullable(),
});

export type TutorialData = z.infer<typeof TutorialDataSchema>;

export const DEFAULT_TUTORIAL_DATA: TutorialData = {
  currentStep: TutorialStep.ENCRYPT_GEMINI_API_KEY, // default to step 1
};
