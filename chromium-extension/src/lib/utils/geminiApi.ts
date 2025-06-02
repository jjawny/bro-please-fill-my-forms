import { GeminiResponse } from "../types/FormField";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export async function generateFormContent(
  apiKey: string,
  formStructure: any,
  userPrompt: string
): Promise<GeminiResponse> {
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

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: systemPrompt,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!generatedText) {
    throw new Error("No response from Gemini API");
  }

  try {
    // Extract JSON from the response (in case there's extra text)
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : generatedText;
    const parsedResponse = JSON.parse(jsonStr);

    return { fields: parsedResponse };
  } catch (error) {
    throw new Error(`Failed to parse Gemini response: ${error}`);
  }
}
