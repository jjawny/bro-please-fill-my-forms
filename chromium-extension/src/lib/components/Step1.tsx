import { CheckIcon, CopyIcon, EyeClosedIcon, EyeIcon, LoaderCircleIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "~/lib/components/shadcn/input";
import { RippleButton } from "~/lib/components/shadcn/ripple";
import { usePinStore } from "~/lib/hooks/stores/usePinStore";
import { cn } from "~/lib/utils/cn";
import { debounce } from "~/lib/utils/debounce-utils";
import { sleep } from "~/lib/utils/sleep-utils";

const MIN_KEY_LENGTH_BEFORE_TESTING_CONNECTION = 16; // Arbitrary number to minimize unnecessary API calls
const SAVE_API_KEY_DEBOUNCE_DELAY_MS = 2_000;

export default function Step1() {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [apiKeyInputValue, setApiKeyInputValue] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  const isFirstRender = useRef<boolean>(true);

  const setNewApiKey = usePinStore((state) => state.setNewApiKey);
  const setIsApiKeyDirty = usePinStore((state) => state.setIsApiKeyDirty);

  useEffect(function setInitialApiKeyInputValueOnceOnMount() {
    if (!isFirstRender.current) return;
    isFirstRender.current = false;

    // This component should be rendered after a successful unlock; the...
    //  decrypted key should be available immediately
    const geminiApiKeyDecrypted = usePinStore.getState().geminiApiKeyDecrypted;
    if (geminiApiKeyDecrypted) {
      setApiKeyInputValue(geminiApiKeyDecrypted);
    }
  }, []);

  const debouncedSaveApiKey = useCallback(
    debounce(async (apiKey: string) => {
      setIsValidating(true);

      await sleep(500); // Simulate latency to avoid flash of validation state (better UX)

      const cleanedApiKey = apiKey.trim();
      const shouldTest = cleanedApiKey.length > MIN_KEY_LENGTH_BEFORE_TESTING_CONNECTION;
      const setApiKeyResponse = await setNewApiKey(cleanedApiKey, shouldTest);

      if (!setApiKeyResponse.isOk) {
        console.warn(setApiKeyResponse.uiMessage, setApiKeyResponse.messages);
        // TODO: toast or set global error?
      } else {
        console.debug(setApiKeyResponse.uiMessage, setApiKeyResponse.value, setApiKeyResponse.messages);
        // TODO: toast or set global error?
      }

      setIsApiKeyDirty(false);
      setIsValidating(false);
    }, SAVE_API_KEY_DEBOUNCE_DELAY_MS),
    [setNewApiKey, setIsApiKeyDirty, setIsValidating],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setApiKeyInputValue(newValue);

      if (!isFirstRender.current) {
        setIsValidating(false);
        setIsApiKeyDirty(true);
        debouncedSaveApiKey(newValue);
      }
    },
    [debouncedSaveApiKey, setIsApiKeyDirty],
  );

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
            onChange={handleInputChange}
            className="bg-white p-2"
            autoComplete="off"
          />
          <ApiKeyInputEndAdornment isValidating={isValidating} hasApiKey={!!apiKeyInputValue} />
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
 */
function ApiKeyInputEndAdornment({ isValidating, hasApiKey }: { isValidating: boolean; hasApiKey: boolean }) {
  const hasGeminiApiKeyConnectedSuccessfully = usePinStore((state) => state.hasGeminiApiKeyConnectedSuccessfully);
  const isGeminiApiKeyDirty = usePinStore((state) => state.isGeminiApiKeyDirty);

  const getIcon = () => {
    if (isValidating) {
      return <LoaderCircleIcon className="h-4 w-4 text-stone-500 animate-spin" />;
    }

    if (isGeminiApiKeyDirty || !hasApiKey) {
      return null;
    }

    if (hasGeminiApiKeyConnectedSuccessfully === true) {
      return <CheckIcon className="h-4 w-4 text-green-500" />;
    }

    if (hasGeminiApiKeyConnectedSuccessfully === false) {
      return <XIcon className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-12 h-6 flex items-center justify-end bg-gradient-to-l from-white via-white to-transparent">
      {getIcon()}
    </div>
  );
}
