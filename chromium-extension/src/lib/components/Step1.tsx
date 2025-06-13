import { CheckIcon, CopyIcon, EyeClosedIcon, EyeIcon } from "lucide-react";
import { useState } from "react";
import { Input } from "~/lib/components/shadcn/input";
import { RippleButton } from "~/lib/components/shadcn/ripple";
import { usePinStore } from "~/lib/stores/PinStore";
import { cn } from "~/lib/utils/cn";

export default function Step1() {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [apiKeyInputValue, setApiKeyInputValue] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const useNewApiKey = usePinStore((state) => state.useNewApiKey);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(apiKeyInputValue);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1_000);
  };

  const handleUseNewKey = async () => {
    await useNewApiKey(apiKeyInputValue);
  };

  return (
    <>
      <h2 className="text-start">1. Enter a Gemini API Key</h2>
      <div className="flex gap-1 items-center w-full">
        <Input
          type={isVisible ? "text" : "password"}
          placeholder="Gemini API Key"
          value={apiKeyInputValue}
          onChange={(e) => setApiKeyInputValue(e.target.value)}
          className="bg-white w-full p-2"
        />
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
      <RippleButton onClick={handleUseNewKey} className="h-7">
        Use Key
      </RippleButton>
    </>
  );
}
