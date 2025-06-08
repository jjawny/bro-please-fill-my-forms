import { useEffect, useState } from "react";
import { usePinStore } from "../../stores/PinStore";
import BetterPassCode from "./BetterPassCode";

export default function BetterStepOne() {
  const { isInitialized, unlock, pin: savedPin, pinStatus, setNewPin: setupPin, GET_DEBUG_JSON_DUMP } = usePinStore();
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | undefined>();

  useEffect(() => {
    if (isInitialized) {
      attemptAutoUnlock();
    }
  }, [isInitialized]);

  // 1. Initialize the store to load any previously saved data
  // 2. If a PIN is saved (session storage), attempt to unlock with it
  // 3. The unlock fn will change the pinStatus to UNLOCKED if successful, SETTING_UP if corrupt, or remain LOCKED
  const attemptAutoUnlock = async () => {
    console.log("Attempting auto unlock with PIN:", savedPin);
    if (savedPin) {
      var unlockResponse = await unlock(savedPin);
      if (unlockResponse.isOk) {
        console.log("Auto-unlock successful");
      } else {
        console.error("Auto-unlock failed:", unlockResponse.error);
      }
    }
  };

  const handlePinSubmit = async (pin: string) => {
    setIsShaking(false);
    setPinError(undefined);

    if (pinStatus === "SETTING_UP") {
      const setupPinResponse = await setupPin(pin);

      if (setupPinResponse.isOk) {
        console.log("PIN setup successful");
      } else {
        console.error("PIN setup failed:", setupPinResponse.error);
        setIsShaking(true);
        setPinError(setupPinResponse.error);
      }
    }

    if (pinStatus === "LOCKED") {
      const unlockResponse = await unlock(pin);

      if (unlockResponse.isOk) {
        console.log("Unlock successful");
      } else {
        console.error("Unlock failed:", unlockResponse.error);
        setIsShaking(true);
        setPinError(unlockResponse.error);
      }
    }
  };

  return (
    <>
      <pre className="text-left text-xs max-w-[400px] overflow-x-scroll">{GET_DEBUG_JSON_DUMP()}</pre>
      <BetterPassCode isPlayShakeAnimation={isShaking} onComplete={handlePinSubmit} error={pinError} />
    </>
  );
}
