import { GoogleGenAI } from "@google/genai";
import { err, ErrOr, ok } from "~/lib/models/ErrOr";
import { GeminiResponse } from "~/lib/models/FormField";
import { logError } from "~/lib/utils/log-utils";

export async function validateApiKey(apiKey: string): Promise<ErrOr<boolean>> {
  let messages = ["Begin validating Gemini API key"];

  try {
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

// TODO:
export async function generateFormContent(
  apiKey: string,
  formStructure: any,
  userPrompt: string,
): Promise<ErrOr<GeminiResponse>> {
  let messages = ["Begin completing form content"];

  try {
    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are a form-filling assistant. Given a form structure and user input, generate appropriate content for each field. 

Rules:
1. Only fill fields that make sense based on the user's prompt
2. Leave fields empty (don't include in response) if they don't relate to the user's input
3. Respond with a JSON object where keys are field names/ids and values are the content to fill
4. For select/radio fields, use only the provided options
5. Keep responses concise and appropriate for form fields

Form structure: ${JSON.stringify(formStructure)}

User prompt: ${userPrompt}

Respond with only a JSON object in this format:
{
  "fieldName1": "value1",
  "fieldName2": "value2"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: systemPrompt,
    });
    const generatedText = response.text;

    if (!generatedText) {
      return err({ messages, uiMessage: "No response from Gemini API" });
    }

    // Extract JSON from the response (in case there's extra text)
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : generatedText;
    const parsedResponse = JSON.parse(jsonStr);

    return ok({ messages, uiMessage: "Successfully generated form content", value: { fields: parsedResponse } });
  } catch (error: unknown) {
    return err({ messages, uiMessage: logError(error, "Failed to generate form content") });
  }
}
