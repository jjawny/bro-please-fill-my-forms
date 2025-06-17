import { useEffect, useRef, useState } from "react";
import Pin, { PinHelperText } from "~/lib/components/Pin";
import { RippleButton } from "~/lib/components/shadcn/ripple";
import { usePinStore } from "~/lib/hooks/stores/usePinStore";
import DialogWrapper from "./DialogWrapper";

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

  useEffect(() => {
    const autoUnlock = async () => {
      // 1. Initialize the store to load any previously saved data
      // 2. If a PIN is saved (session storage), attempt to unlock with it
      // 3. The unlock fn will change the pinMode to UNLOCKED if successful, SETTING_UP if corrupt, or remain LOCKED
      if (!hasAttemptedAutoUnlock.current && isInitialized && savedPin) {
        hasAttemptedAutoUnlock.current = true;
        const unlockResponse = await unlock(savedPin);
        if (!unlockResponse.isOk) {
          console.warn(unlockResponse.uiMessage, unlockResponse.messages);
          // TODO: toast or set global error?
        } else {
          console.debug(unlockResponse.uiMessage, unlockResponse.value, unlockResponse.messages);
          // TODO: toast or set global error?
        }
      }
    };
    autoUnlock();
  }, [isInitialized, savedPin]);

  const handlePinSubmit = async (pin: string) => {
    setIsSubmitting(true);
    setIsShaking(false);
    setPinError(undefined);
    setPinValue("");

    if (pinMode === "SETTING_UP") {
      const setupPinResponse = await setupPin(pin);

      if (setupPinResponse.isOk) {
        console.debug(setupPinResponse.uiMessage, setupPinResponse.value, setupPinResponse.messages);
      } else {
        console.warn(setupPinResponse.uiMessage, setupPinResponse.messages);
        setIsShaking(true);
        setPinError(setupPinResponse.uiMessage);
      }
    }

    if (pinMode === "LOCKED") {
      const unlockResponse = await unlock(pin);

      if (unlockResponse.isOk) {
        console.debug(unlockResponse.uiMessage, unlockResponse.value, unlockResponse.messages);
      } else {
        console.warn(unlockResponse.uiMessage, unlockResponse.messages);
        setIsShaking(true);
        setPinError(unlockResponse.uiMessage);
      }
    }

    setIsSubmitting(false);
  };

  const handleResetPin = async () => {
    setPinError(undefined);

    const resetResponse = await reset();

    if (resetResponse.isOk) {
      console.debug(resetResponse.uiMessage, resetResponse.value, resetResponse.messages);
      // TODO: toast or set global error?
      setPinValue("");
    } else {
      console.warn(resetResponse.uiMessage, resetResponse.messages);
      // TODO: toast or set global error?
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
        <DialogWrapper
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
