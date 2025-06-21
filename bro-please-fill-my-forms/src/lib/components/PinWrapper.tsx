import { useState } from "react";
import Pin, { PinHelperText } from "~/lib/components/Pin";
import { RippleButton } from "~/lib/components/shadcn/ripple";
import { usePinStore } from "~/lib/hooks/stores/usePinStore";
import { logResponse } from "~/lib/utils/log-utils";
import AlertDialogWrapper from "./AlertDialogWrapper";

/**
 * A wrapper for <Pin> with heavier business logic
 */
export default function PinWrapper() {
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | undefined>();
  const [pinValue, setPinValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const unlock = usePinStore((state) => state.unlock);
  const pinMode = usePinStore((state) => state.pinMode);
  const setupPin = usePinStore((state) => state.saveNewPin);
  const reset = usePinStore((state) => state.reset);

  const handlePinSubmit = async (pin: string) => {
    setIsSubmitting(true);
    setIsShaking(false);
    setPinError(undefined);
    setPinValue("");

    if (pinMode === "SETTING_UP") {
      const setupPinResponse = await setupPin(pin);

      logResponse(setupPinResponse);

      if (!setupPinResponse.isOk) {
        setIsShaking(true);
        setPinError(setupPinResponse.uiMessage);
      }
    }

    if (pinMode === "LOCKED") {
      const unlockResponse = await unlock(pin);

      logResponse(unlockResponse);

      if (!unlockResponse.isOk) {
        setIsShaking(true);
        setPinError(unlockResponse.uiMessage);
      }
    }

    setIsSubmitting(false);
  };

  const handleResetPin = async () => {
    setPinError(undefined);

    const resetResponse = await reset();

    logResponse(resetResponse);

    if (resetResponse.isOk) {
      setPinValue("");
    } else {
      setPinError(resetResponse.uiMessage);
    }
  };

  const helperText = pinMode === "SETTING_UP" ? "Set your new PIN" : "Enter your PIN to unlock";
  const pinHelperText: PinHelperText = {
    errorText: pinError,
    helperText: helperText,
  };

  return (
    <>
      <Pin
        isPlayShakeAnimation={isShaking}
        pinHelperText={isSubmitting ? undefined : pinHelperText}
        value={pinValue}
        onChange={setPinValue}
        onComplete={handlePinSubmit}
      />
      {pinMode !== "SETTING_UP" && (
        <AlertDialogWrapper
          title="Are you sure you want to reset your PIN?"
          description="You will need to set an API key again"
          confirmLabel="Reset"
          confirmVariant="destructive"
          onConfirm={handleResetPin}
          trigger={<RippleButton className="mt-2">Reset PIN</RippleButton>}
        />
      )}
    </>
  );
}
