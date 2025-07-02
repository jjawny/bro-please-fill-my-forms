import { err, ErrOr, ok } from "~/lib/models/ErrOr";
import { logError } from "~/lib/utils/log-utils";

// Lazy-loaded (upon first access) then cached onwards
// This improves initial app load perf time (genai chunk no longer included in the main CRX bundle)
// Gains: from 888kB to 630kB = ~30% savings
let ai: typeof import("@google/genai") | undefined;

async function getGenAI() {
  if (!ai) ai = await import("@google/genai");
  return ai;
}

export async function validateApiKey(apiKey: string): Promise<ErrOr<boolean>> {
  let messages = ["Begin validating Gemini API key"];

  try {
    const { GoogleGenAI } = await getGenAI();
    const ai = new GoogleGenAI({ apiKey });

    // Equivalent to a ping/health check, will throw if API key is invalid or network issue
    await ai.models.list();

    return ok({ messages, uiMessage: "Gemini API key is valid", value: true });
  } catch (error: unknown) {
    // Handle expected errors

    // GOTCHA:
    //  Known issue; Google's GenAI lib does not export strongly-typed errors
    //  See https://github.com/googleapis/js-genai/issues/455
    // console.debug(`[INSPECT] Google GenAI error type: '${typeof error}', error:`, error);
    const WORKAROUND_apiKeyInvalidError = "API_KEY_INVALID";
    const WORKAROUND_isApiKeyInvalid = (error as any).message.includes(WORKAROUND_apiKeyInvalidError);
    if (WORKAROUND_isApiKeyInvalid) {
      return ok({ messages, uiMessage: "Invalid Gemini API key", value: false });
    }

    return err({ messages, uiMessage: logError(error, "Failed to check Gemini API key") });
  }
}

export async function generateContent<TStructuredResponse>(
  apiKey: string,
  prompt: string,
  structuredResponseSchema: unknown, // 'unknown' for flexibility; some schemas may have metadata
): Promise<ErrOr<TStructuredResponse>> {
  let messages = ["Begin generating content"];

  try {
    const { GoogleGenAI } = await getGenAI();

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: structuredResponseSchema,
        temperature: 0.0,
      },
    });

    const generatedText = response.text;

    if (!generatedText) {
      return err({ messages, uiMessage: "No response from Gemini" });
    }

    return ok({
      messages,
      uiMessage: "Successfully generated content",
      value: JSON.parse(generatedText) as TStructuredResponse,
    });
  } catch (error: unknown) {
    return err({ messages, uiMessage: logError(error, "Failed to generate content") });
  }
}
