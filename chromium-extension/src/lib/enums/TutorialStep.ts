export const TutorialStep = {
  ENCRYPT_GEMINI_API_KEY: "set_gemini_api_key",
  ENTER_YOUR_PROMPT: "enter_your_prompt",
  PRESS_GO: "press_go",
} as const;

export type TutorialStepType = (typeof TutorialStep)[keyof typeof TutorialStep];
