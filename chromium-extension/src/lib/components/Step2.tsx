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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // TOOD: display the scrapedForm somewhere so the user can click a pop-up to see it
  const [, setScrapedForm] = useState<ScrapedForm | null>(null);

  const setGlobalError = useGlobalStore((state) => state.setGlobalError);

  const isGeminiApiKeyDirty = usePinStore((state) => state.isGeminiApiKeyDirty);
  const hasGeminiApiKeyConnectedSuccessfully = usePinStore((state) => state.hasGeminiApiKeyConnectedSuccessfully);
  const geminiApiKeyDecrypted = usePinStore((state) => state.geminiApiKeyDecrypted);

  const scrapeAndFillForm = async () => {
    if (userPrompt.trim() === "" || !geminiApiKeyDecrypted) {
      console.debug("User prompt and Gemini API key required");
      return;
    }

    setIsSubmitting(true);

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

    setIsSubmitting(false);
  };

  const isSubmitButtonDisabled =
    isSubmitting ||
    !userPrompt.trim() ||
    !geminiApiKeyDecrypted ||
    hasGeminiApiKeyConnectedSuccessfully ||
    isGeminiApiKeyDirty;

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
        {isSubmitting ? "Processing..." : "Fill Form"}
      </RippleButton>
    </div>
  );
}
