import { useEffect } from "react";
import Footer from "~/lib/components/Footer";
import Hero from "~/lib/components/Hero";
import PinWrapper from "~/lib/components/PinWrapper";
import Step1 from "~/lib/components/Step1";
import Step2 from "~/lib/components/Step2";
import Step3 from "~/lib/components/Step3";
import ToggleLockButton from "~/lib/components/ToggleLockButton";
import ToggleThemeButton from "~/lib/components/ToggleThemeButton";
import { usePinStore } from "~/lib/hooks/stores/usePinStore";
import { useUserPreferencesStore } from "~/lib/hooks/stores/useUserPreferencesStore";
import Debug from "./lib/components/Debug";
import GitHubLink from "./lib/components/GitHubLink";
import { useGlobalStore } from "./lib/hooks/stores/useGlobalStore";
import { logResponse } from "./lib/utils/log-utils";

export default function App() {
  const setGlobalError = useGlobalStore((state) => state.setGlobalError);

  const initializePinStore = usePinStore((state) => state.initialize);
  const isPinStoreInitialized = usePinStore((state) => state.isInitialized);
  const pinMode = usePinStore((state) => state.pinMode);

  const initializeUserPreferencesStore = useUserPreferencesStore((state) => state.initialize);
  const isUserPreferencesStoreInitialized = useUserPreferencesStore((state) => state.isInitialized);

  // Initialize stores (ONCE at top of component tree)
  useEffect(() => {
    const initStore = async () => {
      if (!isPinStoreInitialized) {
        const initStoreResponse = await initializePinStore();

        logResponse(initStoreResponse);

        if (!initStoreResponse.isOk) {
          setGlobalError(initStoreResponse.uiMessage);
        }
      }
    };

    initStore();
  }, [isPinStoreInitialized, initializePinStore]);

  useEffect(() => {
    const initStore = async () => {
      if (!isUserPreferencesStoreInitialized) {
        const initStoreResponse = await initializeUserPreferencesStore();

        logResponse(initStoreResponse);

        if (!initStoreResponse.isOk) {
          setGlobalError(initStoreResponse.uiMessage);
        }
      }
    };

    initStore();
  }, [isUserPreferencesStoreInitialized, initializeUserPreferencesStore]);

  return (
    <div className="app-container">
      <div className="app-container-content">
        <ToggleLockButton />
        <ToggleThemeButton />
        <Debug />
        <GitHubLink />
        {pinMode !== "UNLOCKED" ? <LockedView /> : <UnlockedView />}
        <Footer />
      </div>
    </div>
  );
}

function LockedView() {
  return (
    <>
      <Hero />
      <PinWrapper />
    </>
  );
}

function UnlockedView() {
  return (
    <div className="flex flex-col gap-6 pt-20 w-full px-1 overflow-y-scroll">
      <Step1 />
      <Step2 />
      <Step3 />
    </div>
  );
}
