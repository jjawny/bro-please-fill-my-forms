import z from "zod/v4";

export const TutorialStep = {
  ENCRYPT_GEMINI_API_KEY: "set_gemini_api_key",
  ENTER_YOUR_PROMPT: "enter_your_prompt",
  PRESS_GO: "press_go",
} as const;

export const TutorialStepSchema = z.enum([
  TutorialStep.ENCRYPT_GEMINI_API_KEY,
  TutorialStep.ENTER_YOUR_PROMPT,
  TutorialStep.PRESS_GO,
]);

export const TutorialStepValues = Object.values(TutorialStep) as readonly TutorialStepType[];

export type TutorialStepType = (typeof TutorialStep)[keyof typeof TutorialStep];
