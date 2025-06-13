import { useState } from "react";
import { SERVICE_WORKER_ACTIONS } from "../service-workers/service-worker-actions";
import { usePinStore } from "../stores/PinStore";
import { ScrapedForm } from "../types/FormField";
import { generateFormContent } from "../utils/geminiApi";

export default function Step3() {
  const [scrapedForm] = useState<ScrapedForm | null>(null);
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [, setErrorMessage] = useState<string>("");

  // const { theme, toggleTheme } = useTheme();
  const { geminiApiKeyDecrypted } = usePinStore();

  const fillForm = async () => {
    if (!scrapedForm || !userPrompt.trim() || !geminiApiKeyDecrypted) {
      setErrorMessage("Please scrape form, enter a prompt, and set your Gemini API key");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const formStructure = scrapedForm.fields.map((field) => ({
        name: field.name || field.id,
        type: field.type,
        label: field.label,
        placeholder: field.placeholder,
        options: field.options,
      }));

      const response = await generateFormContent(geminiApiKeyDecrypted, formStructure, userPrompt);

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0 && tabs[0]?.id) {
          chrome.runtime.sendMessage(
            {
              action: SERVICE_WORKER_ACTIONS.fillFormFields,
              tabId: tabs[0].id,
              formData: response.fields,
              scrapedForm: scrapedForm,
            },
            (fillResponse) => {
              setIsLoading(false);
              if (!fillResponse?.success) {
                setErrorMessage(fillResponse?.error || "Failed to fill form");
              }
            },
          );
        }
      });
    } catch (error) {
      setIsLoading(false);
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
    }
  };

  return (
    <div>
      {/* User Prompt Input */}
      <div style={{ marginBottom: "10px" }}>
        <textarea
          placeholder="Enter your prompt for filling the form (e.g., 'Fill this job application for a software engineer position')"
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          style={{ width: "100%", padding: "8px", minHeight: "60px" }}
        />
      </div>

      {/* Fill Form Button */}
      <button onClick={fillForm} disabled={isLoading || !scrapedForm || !userPrompt.trim() || !geminiApiKeyDecrypted}>
        {isLoading ? "Filling Form..." : "Fill Form with AI"}
      </button>
    </div>
  );
}
