import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "~/lib/ui/shadcn/input-otp";
import { cn } from "~/lib/utils/cn";

const LARGE_STYLES = "w-16 h-16 text-3xl border-stone-300";

export default function Pin({
  isPlayShakeAnimation = false,
  onComplete,
  error,
  helperText,
}: {
  isPlayShakeAnimation: boolean;
  onComplete: (value: string) => void;
  error?: string;
  helperText?: string;
}) {
  const [value, setValue] = useState("");

  const handleComplete = (pin: string) => {
    onComplete(pin);
    setValue("");
  };

  return (
    <>
      <InputOTP
        maxLength={4}
        pattern={REGEXP_ONLY_DIGITS}
        className={cn("bg-white w-")}
        value={value}
        onChange={setValue}
        onComplete={handleComplete}
        autoFocus
      >
        <InputOTPGroup className={cn(isPlayShakeAnimation ? "animate-shake" : "")}>
          <InputOTPSlot className={LARGE_STYLES} index={0} />
          <InputOTPSlot className={LARGE_STYLES} index={1} />
          <InputOTPSlot className={LARGE_STYLES} index={2} />
          <InputOTPSlot className={LARGE_STYLES} index={3} />
        </InputOTPGroup>
      </InputOTP>
      <OneOfPlaceHolder error={error} helperText={helperText} />
    </>
  );
}

const OneOfPlaceHolder = ({ error, helperText }: { error?: string; helperText?: string }) => {
  if (!!error) {
    return <span className="text-red-500 pt-2">{error}</span>;
  }

  return <span className="text-stone-500 pt-2">{helperText ?? <>&#8203;&#x200B;</>}</span>;
};
