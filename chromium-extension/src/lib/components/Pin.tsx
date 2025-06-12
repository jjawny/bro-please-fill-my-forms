import { REGEXP_ONLY_DIGITS } from "input-otp";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "~/lib/ui/shadcn/input-otp";
import { cn } from "~/lib/utils/cn";

const LARGE_STYLES = "w-16 h-16 text-3xl border-stone-300";
export type PinHelperText = {
  errorText?: string;
  helperText?: string;
};

/**
 * Simple PIN component that doesn't reference any stores
 */
export default function Pin({
  isPlayShakeAnimation = false,
  pinHelperText,
  value,
  onChange,
  onComplete,
}: {
  isPlayShakeAnimation: boolean;
  pinHelperText?: PinHelperText;
  value: string;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
}) {
  return (
    <>
      <InputOTP
        maxLength={4}
        pattern={REGEXP_ONLY_DIGITS}
        className={cn("bg-white")}
        value={value}
        onChange={onChange}
        onComplete={onComplete}
        autoFocus
      >
        <InputOTPGroup className={cn(isPlayShakeAnimation && "animate-shake")}>
          <InputOTPSlot className={LARGE_STYLES} index={0} />
          <InputOTPSlot className={LARGE_STYLES} index={1} />
          <InputOTPSlot className={LARGE_STYLES} index={2} />
          <InputOTPSlot className={LARGE_STYLES} index={3} />
        </InputOTPGroup>
      </InputOTP>
      <HelperText pinHelperText={pinHelperText} />
    </>
  );
}

const HelperText = ({ pinHelperText }: { pinHelperText?: PinHelperText }) => {
  if (pinHelperText?.errorText) {
    return <span className="text-red-500 pt-2">{pinHelperText.errorText}</span>;
  }

  return <span className="text-stone-500 pt-2">{pinHelperText?.helperText ?? "\u200B"}</span>;
};
