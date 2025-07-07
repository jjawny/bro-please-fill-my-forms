import { CheckIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { TutorialStep } from "~/lib/enums/TutorialStep";
import { useGlobalStore } from "~/lib/hooks/stores/useGlobalStore";
import { usePinStore } from "~/lib/hooks/stores/usePinStore";
import { ScrapedForm } from "~/lib/models/FormField";
import {
  PopulatedFormFieldsLlmResponse,
  PopulatedFormFieldsLlmResponseSchema,
} from "~/lib/models/llm-structured-responses/PopulateFormFieldLlmResponse";
import { markdown as fillFormPrompt } from "~/lib/prompts/fill-form.md";
import { fillFormFields, getActiveTab, scrapeFormFields } from "~/lib/services/chrome-service";
import { generate } from "~/lib/services/gemini-service";
import { cn } from "~/lib/utils/cn";
import { debounce } from "~/lib/utils/debounce-utils";
import { logResponse } from "~/lib/utils/log-utils";
import { populatePrompt } from "~/lib/utils/prompt-utils";
import ScrapedFormFieldsPreview from "./ScrapedFormFieldsPreview";
import RippleButton from "./shadcn/ripple";
import { Textarea } from "./shadcn/textarea";
import Spinner from "./Spinner";
import ToolTipWrapper from "./ToolTipWrapper";
import TutorialToolTip from "./TutorialToolTip";

const SAVE_PROMPT_DEBOUNCE_DELAY_MS = 2_000;

export default function Step2() {
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [scrapedForm, setScrapedForm] = useState<ScrapedForm | undefined>(undefined);

  const setGlobalError = useGlobalStore((state) => state.setGlobalError);
  const completeTutorialStep = useGlobalStore((state) => state.completeTutorialStep);

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

  const debouncedSavePrompt = useCallback(
    debounce(async (prompt: string) => {
      const savePromptResponse = await savePrompt(prompt);

      logResponse(savePromptResponse);

      if (!savePromptResponse.isOk) {
        setGlobalError(savePromptResponse.uiMessage);
        // Continue even if not OK, this is just a quality of life
      }
    }, SAVE_PROMPT_DEBOUNCE_DELAY_MS),
    [savePrompt, setGlobalError],
  );

  const handlePromptChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPrompt = e.target.value;
    setUserPrompt(newPrompt);

    const completeTutorialStepResponse = await completeTutorialStep(TutorialStep.ENTER_YOUR_PROMPT);

    logResponse(completeTutorialStepResponse);

    if (!completeTutorialStepResponse.isOk) {
      setGlobalError(completeTutorialStepResponse.uiMessage);
      // Continue even if not OK, this is just a quality of life
    }

    debouncedSavePrompt(newPrompt);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const completeTutorialStepResponse = await completeTutorialStep(TutorialStep.PRESS_GO);

    logResponse(completeTutorialStepResponse);

    if (!completeTutorialStepResponse.isOk) {
      setGlobalError(completeTutorialStepResponse.uiMessage);
      // Continue even if not OK, this is just a quality of life
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

    // 3. Generate the final form
    const finalPrompt = populatePrompt(fillFormPrompt, {
      formFields: JSON.stringify(scrapedForm, null, 2),
      userContent: userPrompt,
    });

    const aiResponse = await generate<PopulatedFormFieldsLlmResponse>(
      geminiApiKeyDecrypted,
      finalPrompt,
      PopulatedFormFieldsLlmResponseSchema,
    );

    logResponse(aiResponse);

    if (!aiResponse.isOk) {
      setGlobalError(aiResponse.uiMessage);
      return false;
    }

    // 4. Fill the form
    const fillResponse = await fillFormFields(tabId, aiResponse.value);

    logResponse(fillResponse);

    if (!fillResponse.isOk) {
      setGlobalError(scrapeFormResponse.uiMessage);
      return false;
    }

    return true;
  };

  const getSubmitButtonDisabledMessage = (): string | undefined => {
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
    <form onSubmit={onSubmit}>
      <TutorialToolTip
        content="Enter your form content here, describe what you want"
        step={TutorialStep.ENTER_YOUR_PROMPT}
      >
        <div className="relative">
          <Textarea
            value={userPrompt}
            rows={7}
            placeholder="Your form content"
            onChange={handlePromptChange}
            className={cn("bg-[var(--pin-background-color)] resize-none ![field-sizing:initial]")}
          />
          {scrapedForm && (
            <ScrapedFormFieldsPreview
              scrapedForm={scrapedForm}
              className="absolute bottom-0 left-0 right-0 h-fit pt-6 pb-1 rounded-md m-[1px] flex items-center px-2 bg-gradient-to-t from-[var(--pin-background-color)] via-[var(--pin-background-color)] to-transparent justify-end"
            />
          )}
        </div>
      </TutorialToolTip>

      <TutorialToolTip content="Push the button!" step={TutorialStep.PRESS_GO}>
        <div className="px-2">
          <SubmitButton
            isDisabledMessage={getSubmitButtonDisabledMessage()}
            isDisabled={isSubmitButtonDisabled}
            isSubmitting={isSubmitting}
            isDone={isDone}
          />
        </div>
      </TutorialToolTip>
    </form>
  );
}

function SubmitButton({
  isDisabledMessage,
  isDisabled,
  isSubmitting,
  isDone,
}: {
  isDisabledMessage?: string;
  isDisabled?: boolean;
  isSubmitting?: boolean;
  isDone?: boolean;
}) {
  const InnerContent = () => {
    return (
      <RippleButton type="submit" disabled={isDisabled} className={cn("select-none w-full mt-2 h-6")}>
        {isSubmitting ? <Spinner /> : isDone ? <CheckIcon className="animate-bounce-in text-lime-500" /> : "Fill Form"}
      </RippleButton>
    );
  };

  if (isDisabled && isDisabledMessage) {
    return (
      <ToolTipWrapper delayDuration={800} content={isDisabledMessage} side="bottom">
        <InnerContent />
      </ToolTipWrapper>
    );
  }

  return <InnerContent />;
}
