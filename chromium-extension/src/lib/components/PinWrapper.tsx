import { useEffect, useRef, useState } from "react";
import Pin, { PinHelperText } from "~/lib/components/Pin";
import { RippleButton } from "~/lib/components/shadcn/ripple";
import { usePinStore } from "~/lib/stores/PinStore";
import ConfirmDialog from "./ConfirmDialog";

/**
 * A wrapper for <Pin> with heavier business logic
 */
export default function PinWrapper() {
  const isInitialized = usePinStore((state) => state.isInitialized);
  const unlock = usePinStore((state) => state.unlock);
  const savedPin = usePinStore((state) => state.pin);
  const pinMode = usePinStore((state) => state.pinMode);
  const setupPin = usePinStore((state) => state.setNewPin);
  const reset = usePinStore((state) => state.reset);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | undefined>();
  const [pinValue, setPinValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const hasAttemptedAutoUnlock = useRef<boolean>(false);

  useEffect(
    function autoUnlock() {
      // 1. Initialize the store to load any previously saved data
      // 2. If a PIN is saved (session storage), attempt to unlock with it
      // 3. The unlock fn will change the pinMode to UNLOCKED if successful, SETTING_UP if corrupt, or remain LOCKED
      if (!hasAttemptedAutoUnlock.current && isInitialized && savedPin) {
        hasAttemptedAutoUnlock.current = true;
        unlock(savedPin);
      }
    },
    [isInitialized, savedPin],
  );

  const handlePinSubmit = async (pin: string) => {
    setIsSubmitting(true);
    setIsShaking(false);
    setPinError(undefined);
    setPinValue("");

    if (pinMode === "SETTING_UP") {
      const setupPinResponse = await setupPin(pin);

      if (setupPinResponse.isOk) {
        console.debug("PIN setup successful");
      } else {
        console.error("PIN setup failed:", setupPinResponse.error);
        setIsShaking(true);
        setPinError(setupPinResponse.error);
      }
    }

    if (pinMode === "LOCKED") {
      const unlockResponse = await unlock(pin);

      if (unlockResponse.isOk) {
        console.debug("Unlock successful");
      } else {
        console.error("Unlock failed:", unlockResponse.error);
        setIsShaking(true);
        setPinError(unlockResponse.error);
      }
    }

    setIsSubmitting(false);
  };

  const handleResetPin = async () => {
    setPinError(undefined);

    const resetResponse = await reset();

    if (resetResponse.isOk) {
      setPinValue("");
      console.log("PIN reset successful");
      return;
    }

    console.error("PIN reset failed:", resetResponse.error);
    setPinError(resetResponse.error);
    return;
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
        <ConfirmDialog
          title="Are you sure you want to reset your PIN?"
          description="You will need to set an API key again"
          confirmLabel="Reset"
          confirmVariant="destructive"
          onConfirm={handleResetPin}
          trigger={<RippleButton className="mt-6">Reset PIN</RippleButton>}
        />
      )}
    </>
  );
}
