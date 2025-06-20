import { CheckIcon, LoaderCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { MOCK_SCRAPED_FORM } from "~/lib/constants/mock-data";
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
import { cn } from "~/lib/utils/cn";
import { logResponse } from "~/lib/utils/log-utils";
import { populatePrompt } from "~/lib/utils/prompt-utils";
import FormFieldBadgeRow from "./FormFieldBadgeRow";
import { RippleButton } from "./shadcn/ripple";
import { Textarea } from "./shadcn/textarea";
import ToolTipWrapper from "./ToolTipWrapper";

export default function Step2() {
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [scrapedForm, setScrapedForm] = useState<ScrapedForm | undefined>(MOCK_SCRAPED_FORM);

  const setGlobalError = useGlobalStore((state) => state.setGlobalError);

  const isGeminiApiKeyDirty = usePinStore((state) => state.isGeminiApiKeyDirty);
  const hasGeminiApiKeyConnectedSuccessfully = usePinStore((state) => state.hasGeminiApiKeyConnectedSuccessfully);
  const geminiApiKeyDecrypted = usePinStore((state) => state.geminiApiKeyDecrypted);
  const savePrompt = usePinStore((state) => state.savePrompt);

  useEffect(function setInitialUserPromptValueOnceOnMount() {
    const tempCachedPrompt = usePinStore.getState().prompt;
    if (tempCachedPrompt) {
      setUserPrompt(tempCachedPrompt);
    }
  }, []);

  const onSubmit = async () => {
    setIsSubmitting(true);
    const savePromptResponse = await savePrompt(userPrompt);

    logResponse(savePromptResponse);

    if (!savePromptResponse.isOk) {
      setGlobalError(savePromptResponse.uiMessage);
      // Continue even if not OK, this is just a quality of life; user's input cached for the browser session
    }

    const isSuccessful = await scrapeAndFillForm();
    if (isSuccessful) {
      setIsDone(true);
      setTimeout(() => setIsDone(false), 1_000);
    }
    setIsSubmitting(false);
  };

  const scrapeAndFillForm = async (): Promise<boolean> => {
    if (userPrompt.trim() === "" || !geminiApiKeyDecrypted) {
      return false;
    }

    // 1. Get the active tab
    const getActiveTabResponse = await getActiveTab();

    logResponse(getActiveTabResponse);

    if (!getActiveTabResponse.isOk) {
      setGlobalError(getActiveTabResponse.uiMessage);
      return false;
    }

    const tabId = getActiveTabResponse.value.id;

    if (!tabId) {
      setGlobalError("No active tab found");
      return false;
    }

    // 2. Scrape form fields
    const scrapeFormResponse = await scrapeFormFields(tabId);

    logResponse(scrapeFormResponse);

    if (!scrapeFormResponse.isOk) {
      setGlobalError(scrapeFormResponse.uiMessage);
      return false;
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
      return false;
    }

    // 5. Fill form fields with generated content
    const fillResponse = await fillFormFields(tabId, aiResponse.value);

    logResponse(fillResponse);

    if (!fillResponse.isOk) {
      setGlobalError(scrapeFormResponse.uiMessage);
      return false;
    }

    return true;
  };

  const getToolTipMessage = (): string | undefined => {
    if (isSubmitting) return "Please wait, filling your form...";
    if (!userPrompt.trim()) return "Please enter your form content";
    if (!geminiApiKeyDecrypted) return "Gemini API key is required";
    if (!hasGeminiApiKeyConnectedSuccessfully) return "Gemini API key failed to connect, please check your key";
    if (isGeminiApiKeyDirty) return "Please wait, saving your Gemini API key...";

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
      <div className="relative">
        <Textarea
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="Your form content"
          rows={8}
          className={cn("bg-[var(--pin-background-color)] resize-none ![field-sizing:initial]")}
        />
        {scrapedForm && (
          <FormFieldBadgeRow
            scrapedForm={scrapedForm}
            className="absolute bottom-0 left-0 right-0 h-fit pt-6 pb-1 rounded-md m-[1px] flex items-center px-2 bg-gradient-to-t from-[var(--pin-background-color)] via-[var(--pin-background-color)] to-transparent justify-end"
          />
        )}
      </div>
      <ToolTipWrapper
        delayDuration={800}
        content={getToolTipMessage()}
        open={isSubmitButtonDisabled ? undefined : false}
        side="bottom"
      >
        <div className="px-2">
          <RippleButton onClick={onSubmit} disabled={isSubmitButtonDisabled} className={cn("w-full mt-2 h-6")}>
            {isSubmitting ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : isDone ? (
              <CheckIcon className="animate-bounce-in text-lime-500" />
            ) : (
              "Fill Form"
            )}
          </RippleButton>
        </div>
      </ToolTipWrapper>
    </div>
  );
}
