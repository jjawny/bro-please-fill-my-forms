import { CheckIcon, CopyIcon, EyeClosedIcon, EyeIcon } from "lucide-react";
import { useState } from "react";
import { Input } from "~/lib/components/shadcn/input";
import { RippleButton } from "~/lib/components/shadcn/ripple";
import { cn } from "~/lib/utils/cn";

export default function Step1() {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [apiKeyInputValue, setApiKeyInputValue] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(apiKeyInputValue);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1_000);
  };

  return (
    <div>
      <h2 className="text-start">1. Enter a Gemini API Key</h2>
      <div className="flex gap-1 items-center w-full">
        <form className="w-full">
          <Input
            type={isVisible ? "text" : "password"}
            placeholder="Gemini API Key"
            value={apiKeyInputValue}
            onChange={(e) => setApiKeyInputValue(e.target.value)}
            className="bg-white p-2"
            autoComplete="off"
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
