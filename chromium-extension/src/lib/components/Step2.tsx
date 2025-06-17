import { useState } from "react";
import { usePinStore } from "~/lib/hooks/stores/usePinStore";
import { FormField, ScrapedForm } from "~/lib/models/FormField";
import { fillFormFields, getActiveTab, scrapeFormFields } from "~/lib/services/chrome-service";
import { generateFormContent } from "~/lib/services/gemini-service";
import { useGlobalStore } from "../hooks/stores/useGlobalStore";
import { logResponse } from "../utils/log-utils";
import { RippleButton } from "./shadcn/ripple";
import { Textarea } from "./shadcn/textarea";

export default function Step2() {
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [, setErrorMessage] = useState<string>("");

  const [scrapedForm, setScrapedForm] = useState<ScrapedForm | null>(null);

  const setGlobalError = useGlobalStore((state) => state.setGlobalError);

  const isGeminiApiKeyDirty = usePinStore((state) => state.isGeminiApiKeyDirty);

  // const { theme, toggleTheme } = useTheme();
  const { geminiApiKeyDecrypted } = usePinStore();

  const scrapeAndFillForm = async () => {
    if (userPrompt.trim() === "" || !geminiApiKeyDecrypted) {
      setErrorMessage("Please enter a prompt and set your Gemini API key");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      // 1. Get the active tab
      const getActiveTabResponse = await getActiveTab();

      logResponse(getActiveTabResponse);

      if (!getActiveTabResponse.isOk) {
        setGlobalError(getActiveTabResponse.uiMessage);
        return;
      }

      const tabId = getActiveTabResponse.value.id;

      if (!tabId) {
        setGlobalError("No active tab found");
        return;
      }

      // 2. Scrape form fields
      const scrapeResponse = await scrapeFormFields(tabId);
      if (!scrapeResponse.isOk) {
        throw new Error(scrapeResponse.uiMessage || "Failed to scrape form");
      }

      const scrapedFormData = scrapeResponse.value;
      setScrapedForm(scrapedFormData);

      // Generate AI content
      const formStructure = scrapedFormData.fields.map((field: FormField) => ({
        name: field.name || field.id,
        type: field.type,
        label: field.label,
        placeholder: field.placeholder,
        options: field.options,
      }));

      const aiResponse = await generateFormContent(geminiApiKeyDecrypted, formStructure, userPrompt);

      if (!aiResponse.isOk) {
        throw new Error(aiResponse.uiMessage);
      }

      // Fill form fields
      const fillResponse = await fillFormFields(tabId, aiResponse.value.fields, scrapedFormData);
      if (!fillResponse.isOk) {
        throw new Error(fillResponse.uiMessage || "Failed to fill form");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitButtonDisabled = isLoading || !userPrompt.trim() || !geminiApiKeyDecrypted || isGeminiApiKeyDirty;

  return (
    <div>
      <Textarea
        value={userPrompt}
        onChange={(e) => setUserPrompt(e.target.value)}
        placeholder="Your form content"
        rows={5}
        className="bg-white text-black resize-none ![field-sizing:initial]"
      />
      <RippleButton onClick={scrapeAndFillForm} disabled={isSubmitButtonDisabled} className="w-full mt-2 h-6">
        {isLoading ? "Processing..." : "Fill Form"}
      </RippleButton>
    </div>
  );
}
