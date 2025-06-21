import { LoaderCircleIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Hero from "~/lib/components/Hero";
import PinWrapper from "~/lib/components/PinWrapper";
import Step1 from "~/lib/components/Step1";
import Step2 from "~/lib/components/Step2";
import { useGlobalStore } from "~/lib/hooks/stores/useGlobalStore";
import { usePinStore } from "~/lib/hooks/stores/usePinStore";
import { logResponse } from "~/lib/utils/log-utils";
import { sleep } from "~/lib/utils/sleep-utils";
import HeroLogo from "./HeroLogo";

export default function AppContent() {
  const [isAutoUnlocking, setIsAutoUnlocking] = useState<boolean>(true);

  const hasAttemptedAutoUnlock = useRef<boolean>(false);

  const setGlobalError = useGlobalStore((state) => state.setGlobalError);

  const isInitialized = usePinStore((state) => state.isInitialized);
  const pin = usePinStore((state) => state.pin);
  const pinMode = usePinStore((state) => state.pinMode);
  const unlock = usePinStore((state) => state.unlock);

  useEffect(() => {
    const autoUnlock = async () => {
      if (!hasAttemptedAutoUnlock.current && isInitialized) {
        hasAttemptedAutoUnlock.current = true;

        if (pin) {
          const unlockResponse = await unlock(pin);

          logResponse(unlockResponse);

          if (!unlockResponse.isOk) {
            setGlobalError(unlockResponse.uiMessage);
          }
        }

        await sleep(100); // Simulate latency to avoid flash of validation state (better UX)
        setIsAutoUnlocking(false);
      }
    };
    autoUnlock();
  }, [isInitialized, pin]);

  if (isAutoUnlocking) {
    return <LoaderCircleIcon className="h-10 w-10 text-stone-500 animate-spin" />;
  }

  if (pinMode === "UNLOCKED") {
    return (
      <div className="relative flex flex-col gap-6 pt-4 h-full justify-center w-full px-1 overflow-y-scroll">
        <HeroLogo heightPx={20} className="absolute top-1 w-full justify-items-center" />
        <Step1 />
        <Step2 />
      </div>
    );
  }
  return (
    <>
      <Hero />
      <PinWrapper />
    </>
  );
}
