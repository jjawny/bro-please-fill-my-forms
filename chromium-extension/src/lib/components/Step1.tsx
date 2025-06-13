import { CheckIcon, CopyIcon, EyeClosedIcon, EyeIcon, LoaderCircleIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Input } from "~/lib/components/shadcn/input";
import { RippleButton } from "~/lib/components/shadcn/ripple";
import { usePinStore } from "~/lib/stores/PinStore";
import { cn } from "~/lib/utils/cn";
import { debounce } from "~/lib/utils/debounce";

const MIN_KEY_LENGTH_BEFORE_TESTING_CONNECTION = 16; // Arbitrary number to minimize unnecessary API calls

export default function Step1() {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [apiKeyInputValue, setApiKeyInputValue] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  const hasGeminiApiKeyConnectedSuccessfully = usePinStore((state) => state.hasGeminiApiKeyConnectedSuccessfully);
  const setNewApiKey = usePinStore((state) => state.setNewApiKey);

  const debouncedSaveApiKey = useCallback(
    debounce(async (apiKey: string) => {
      try {
        const cleanedApiKey = apiKey.trim();
        const shouldTest = cleanedApiKey.length > MIN_KEY_LENGTH_BEFORE_TESTING_CONNECTION;
        await setNewApiKey(cleanedApiKey, shouldTest);
        setIsDirty(false);
      } catch (error) {
        console.error("Failed to set API key:", error);
      } finally {
        setIsValidating(false);
      }
    }, 2_000),
    [setNewApiKey, setIsDirty, setIsValidating],
  );

  useEffect(() => {
    setIsValidating(true);
    setIsDirty(true);
    debouncedSaveApiKey(apiKeyInputValue);
  }, [apiKeyInputValue, debouncedSaveApiKey]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(apiKeyInputValue);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1_000);
  };

  return (
    <div>
      <h2 className="text-start">1. Enter a Gemini API Key</h2>
      <div className="flex gap-1 items-center w-full">
        <form className="w-full relative">
          <Input
            type={isVisible ? "text" : "password"}
            placeholder="Gemini API Key"
            value={apiKeyInputValue}
            onChange={(e) => setApiKeyInputValue(e.target.value)}
            className="bg-white p-2"
            autoComplete="off"
          />
          <ApiKeyInputEndAdornment
            isValidating={isValidating}
            isDirty={isDirty}
            hasApiKey={!!apiKeyInputValue}
            hasGeminiApiKeyConnectedSuccessfully={!!hasGeminiApiKeyConnectedSuccessfully}
          />
        </form>
        <RippleButton
          title={isVisible ? "Hide value" : "Show value"}
          size="icon"
          variant="secondary"
          onClick={() => setIsVisible(!isVisible)}
          className="size-9"
        >
          {isVisible ? <EyeClosedIcon /> : <EyeIcon />}
        </RippleButton>
        <RippleButton
          title="Copy"
          size="icon"
          variant="secondary"
          onClick={handleCopy}
          className={cn("size-9", isCopied && "text-lime-500 animate-bounce-in")}
        >
          {isCopied ? <CheckIcon /> : <CopyIcon />}
        </RippleButton>
      </div>
    </div>
  );
}

/**
 * Hints at the state of the API key (order matters)
 * @param args
 * @returns
 */
function ApiKeyInputEndAdornment(args: {
  isValidating: boolean;
  isDirty: boolean;
  hasApiKey: boolean;
  hasGeminiApiKeyConnectedSuccessfully: boolean;
}) {
  const { isValidating, isDirty, hasApiKey, hasGeminiApiKeyConnectedSuccessfully } = args;

  const getIcon = () => {
    if (isValidating) {
      return <LoaderCircleIcon className="h-4 w-4 text-stone-500 animate-spin" />;
    }

    if (isDirty || !hasApiKey) {
      return null;
    }

    if (hasGeminiApiKeyConnectedSuccessfully) {
      return <CheckIcon className="h-4 w-4 text-green-500" />;
    }

    if (!hasGeminiApiKeyConnectedSuccessfully) {
      return <XIcon className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-12 h-6 flex items-center justify-end bg-gradient-to-l from-white via-white to-transparent">
      {getIcon()}
    </div>
  );
}
