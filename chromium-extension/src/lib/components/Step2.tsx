import { LoaderCircleIcon } from "lucide-react";
import { useState } from "react";
import { useGlobalStore } from "~/lib/hooks/stores/useGlobalStore";
import { usePinStore } from "~/lib/hooks/stores/usePinStore";
import { ScrapedForm } from "~/lib/models/FormField";
import {
  PopulatedFormFieldsLlmResponse,
  PopulatedFormFieldsLlmResponse_SCHEMA,
} from "~/lib/models/llm-structured-responses/PopulateFormFieldLlmResponse";
import { markdown as fillFormPrompt } from "~/lib/prompts/fill-form.md";
import { fillFormFields, getActiveTab, scrapeFormFields } from "~/lib/services/chrome-service";
import { generateContent } from "~/lib/services/gemini-service";
import { logResponse } from "~/lib/utils/log-utils";
import { populatePrompt } from "~/lib/utils/prompt-utils";
import { RippleButton } from "./shadcn/ripple";
import { Textarea } from "./shadcn/textarea";
import ToolTipWrapper from "./ToolTipWrapper";

export default function Step2() {
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // TODO: display the scrapedForm somewhere so the user can click a pop-up to see it
  const [, setScrapedForm] = useState<ScrapedForm | null>(null);

  const setGlobalError = useGlobalStore((state) => state.setGlobalError);

  const isGeminiApiKeyDirty = usePinStore((state) => state.isGeminiApiKeyDirty);
  const hasGeminiApiKeyConnectedSuccessfully = usePinStore((state) => state.hasGeminiApiKeyConnectedSuccessfully);
  const geminiApiKeyDecrypted = usePinStore((state) => state.geminiApiKeyDecrypted);

  const onSubmit = async () => {
    setIsSubmitting(true);
    await scrapeAndFillForm();
    setIsSubmitting(false);
  };

  const scrapeAndFillForm = async () => {
    if (userPrompt.trim() === "" || !geminiApiKeyDecrypted) {
      console.debug("User prompt and Gemini API key required");
      return;
    }

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
    const scrapeFormResponse = await scrapeFormFields(tabId);

    logResponse(scrapeFormResponse);

    if (!scrapeFormResponse.isOk) {
      setGlobalError(scrapeFormResponse.uiMessage);
      return;
    }

    const scrapedForm = scrapeFormResponse.value;

    setScrapedForm(scrapedForm);

    // 3. Generate AI content
    const finalPrompt = populatePrompt(fillFormPrompt, {
      form: JSON.stringify(scrapedForm, null, 2),
      userInput: userPrompt,
    });

    // 4. Generate content for form fields
    const aiResponse = await generateContent<PopulatedFormFieldsLlmResponse>(
      geminiApiKeyDecrypted,
      finalPrompt,
      PopulatedFormFieldsLlmResponse_SCHEMA,
    );

    logResponse(aiResponse);

    if (!aiResponse.isOk) {
      setGlobalError(aiResponse.uiMessage);
      return;
    }

    // 5. Fill form fields with generated content
    const fillResponse = await fillFormFields(tabId, aiResponse.value);

    logResponse(fillResponse);

    if (!fillResponse.isOk) {
      setGlobalError(scrapeFormResponse.uiMessage);
      return;
    }
  };

  const getToolTipMessage = (): string | undefined => {
    if (isSubmitting) return "Please wait, processing...";

    if (!userPrompt.trim()) return "Please enter a prompt first";

    if (!geminiApiKeyDecrypted) return "Gemini API key is required";

    if (!hasGeminiApiKeyConnectedSuccessfully) return "Gemini API key failed to connect, please check your key";

    if (isGeminiApiKeyDirty) return "Please wait, saving your Gemini API key";

    return undefined;
  };

  const isSubmitButtonDisabled =
    isSubmitting ||
    !userPrompt.trim() ||
    !geminiApiKeyDecrypted ||
    !hasGeminiApiKeyConnectedSuccessfully ||
    isGeminiApiKeyDirty;

  return (
    <div>
      <Textarea
        value={userPrompt}
        onChange={(e) => setUserPrompt(e.target.value)}
        placeholder="Your form content"
        rows={6}
        className="bg-white text-black resize-none ![field-sizing:initial]"
      />
      <ToolTipWrapper
        delayDuration={800}
        content={getToolTipMessage()}
        open={isSubmitButtonDisabled ? false : undefined}
        side="bottom"
      >
        <div className="px-2">
          <RippleButton onClick={onSubmit} disabled={isSubmitButtonDisabled} className="w-full mt-2 h-6">
            {isSubmitting ? <LoaderCircleIcon className="animate-spin" /> : "Fill Form"}
          </RippleButton>
        </div>
      </ToolTipWrapper>
    </div>
  );
}
