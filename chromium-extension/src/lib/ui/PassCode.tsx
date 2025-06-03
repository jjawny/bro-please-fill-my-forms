import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "~/lib/ui/shadcn/input-otp";
import { cn } from "../utils/cn";

export default function PassCode({
  isPlayShakeAnimation = false,
  onComplete,
}: {
  isPlayShakeAnimation: boolean;
  onComplete: (value: string) => void;
}) {
  return (
    <InputOTP
      maxLength={4}
      pattern={REGEXP_ONLY_DIGITS}
      className={cn("bg-white")}
      onComplete={onComplete}
    >
      <InputOTPGroup
        className={cn(isPlayShakeAnimation ? "animate-shake" : "")}
      >
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
      </InputOTPGroup>
    </InputOTP>
  );
}
