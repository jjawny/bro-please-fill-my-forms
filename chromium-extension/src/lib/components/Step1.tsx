import { CheckIcon, CopyIcon, EyeClosedIcon, EyeIcon } from "lucide-react";
import { useState } from "react";
import { usePinStore } from "~/lib/stores/PinStore";
import { Input } from "~/lib/ui/shadcn/input";
import { RippleButton } from "~/lib/ui/shadcn/ripple";
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
          className="bg-white"
          type={isVisible ? "text" : "password"}
          placeholder="Gemini API Key"
          value={apiKeyInputValue}
          onChange={(e) => setApiKeyInputValue(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        />
        <RippleButton
          title={isVisible ? "Hide value" : "Show value"}
          onClick={() => setIsVisible(!isVisible)}
          variant="secondary"
          size="icon"
          className="size-9"
        >
          {isVisible ? <EyeClosedIcon /> : <EyeIcon />}
        </RippleButton>
        <RippleButton
          title="Copy"
          onClick={handleCopy}
          variant="secondary"
          size="icon"
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
