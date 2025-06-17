import { useState } from "react";
import { usePinStore } from "~/lib/hooks/stores/usePinStore";
import { ScrapedForm } from "~/lib/models/FormField";
import { SERVICE_WORKER_ACTIONS } from "~/lib/service-workers/service-worker-actions";
import { generateFormContent } from "~/lib/services/gemini-service";
import { RippleButton } from "./shadcn/ripple";
import { Textarea } from "./shadcn/textarea";

export default function Step2() {
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [, setErrorMessage] = useState<string>("");

  const [scrapedForm, setScrapedForm] = useState<ScrapedForm | null>(null);

  const isGeminiApiKeyDirty = usePinStore((state) => state.isGeminiApiKeyDirty);

  const scrapeFormFields = () => {
    setIsLoading(true);
    setErrorMessage("");

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0]?.id) {
        chrome.runtime.sendMessage(
          {
            action: SERVICE_WORKER_ACTIONS.scrapeFormFields,
            tabId: tabs[0].id,
          },
          (response) => {
            setIsLoading(false);
            if (response?.success) {
              setScrapedForm(response.form);
            } else {
              setErrorMessage(response?.error || "Failed to scrape form");
            }
          },
        );
      }
    });
  };

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
              formData: response.isOk ? response.value.fields : null,
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

  const isSubmitButtonDisabled = isLoading || !userPrompt.trim() || !geminiApiKeyDecrypted || isGeminiApiKeyDirty;

  return (
    <div>
      <Textarea
        value={userPrompt}
        onChange={(e) => setUserPrompt(e.target.value)}
        placeholder="Form content"
        rows={4}
        className="bg-white text-black resize-none ![field-sizing:initial]"
      />
      <RippleButton onClick={fillForm} disabled={isSubmitButtonDisabled} className="w-full mt-2 h-6">
        {isLoading ? "Filling Form..." : "Fill Form with AI"}
      </RippleButton>
    </div>
  );
}
