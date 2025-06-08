import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "~/lib/ui/shadcn/input-otp";
import { cn } from "~/lib/utils/cn";

export default function BetterPassCode({
  isPlayShakeAnimation = false,
  onComplete,
  error,
}: {
  isPlayShakeAnimation: boolean;
  onComplete: (value: string) => void;
  error?: string;
}) {
  const LARGE_STYLES = "w-16 h-16 text-3xl";

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
      >
        <InputOTPGroup className={cn(isPlayShakeAnimation ? "animate-shake" : "")}>
          <InputOTPSlot className={LARGE_STYLES} index={0} />
          <InputOTPSlot className={LARGE_STYLES} index={1} />
          <InputOTPSlot className={LARGE_STYLES} index={2} />
          <InputOTPSlot className={LARGE_STYLES} index={3} />
        </InputOTPGroup>
      </InputOTP>
      <OneOfPlaceHolder error={error} />
    </>
  );
}

const OneOfPlaceHolder = ({ error }: { error?: string }) => {
  if (!!error) {
    return <span className="text-red-500 pt-2">{error}</span>;
  }

  return <span>&#8203;&#x200B;</span>;
};
