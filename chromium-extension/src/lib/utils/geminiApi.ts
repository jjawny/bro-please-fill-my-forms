import { GoogleGenAI } from "@google/genai";
import { GeminiResponse } from "~/lib/types/FormField";

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const ai = new GoogleGenAI({ apiKey });
    await ai.models.list();
    return true;
  } catch (error) {
    return false;
  }
}

export async function generateFormContent(
  apiKey: string,
  formStructure: any,
  userPrompt: string,
): Promise<GeminiResponse> {
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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: systemPrompt,
    });
    const generatedText = response.text;

    if (!generatedText) {
      throw new Error("No response from Gemini API");
    }

    // Extract JSON from the response (in case there's extra text)
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : generatedText;
    const parsedResponse = JSON.parse(jsonStr);

    return { fields: parsedResponse };
  } catch (error) {
    throw new Error(`Failed to generate form content: ${error}`);
  }
}
