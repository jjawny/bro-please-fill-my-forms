import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "~/lib/ui/shadcn/input-otp";

interface PassCodeProps {
  onComplete: (value: string) => void;
}

export default function PassCode({ onComplete }: PassCodeProps) {
  return (
    <InputOTP
      maxLength={6}
      pattern={REGEXP_ONLY_DIGITS}
      className="bg-white"
      onComplete={onComplete}
    >
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        {/* </InputOTPGroup> */}
        {/* <InputOTPSeparator /> */}
        {/* <InputOTPGroup> */}
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  );
}
