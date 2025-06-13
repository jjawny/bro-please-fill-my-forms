import { REGEXP_ONLY_DIGITS } from "input-otp";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "~/lib/ui/shadcn/input-otp";
import { cn } from "~/lib/utils/cn";

const LARGE_STYLES = "w-16 h-16 text-3xl";

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
  const hasError = !!pinHelperText?.errorText;
  const ariaInvalidLabel = hasError ? "true" : "false";

  return (
    <>
      <InputOTP
        maxLength={4}
        pattern={REGEXP_ONLY_DIGITS}
        value={value}
        onChange={onChange}
        onComplete={onComplete}
        autoFocus
      >
        <InputOTPGroup className={cn(isPlayShakeAnimation && "animate-shake", "shadow-sm")}>
          <InputOTPSlot aria-invalid={ariaInvalidLabel} className={LARGE_STYLES} index={0} />
          <InputOTPSlot aria-invalid={ariaInvalidLabel} className={LARGE_STYLES} index={1} />
          <InputOTPSlot aria-invalid={ariaInvalidLabel} className={LARGE_STYLES} index={2} />
          <InputOTPSlot aria-invalid={ariaInvalidLabel} className={LARGE_STYLES} index={3} />
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

  return <span className="pt-2 opacity-50">{pinHelperText?.helperText ?? "\u200B"}</span>;
};
