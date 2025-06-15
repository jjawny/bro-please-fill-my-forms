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

export default function App() {
  const initializePinStore = usePinStore((state) => state.initialize);
  const isPinStoreInitialized = usePinStore((state) => state.isInitialized);
  const setPinStoreFatalError = usePinStore((state) => state.setFatalError);
  const pinMode = usePinStore((state) => state.pinMode);

  const initializeUserPreferencesStore = useUserPreferencesStore((state) => state.initialize);
  const isUserPreferencesStoreInitialized = useUserPreferencesStore((state) => state.isInitialized);
  const setUserPreferencesStoreFatalError = useUserPreferencesStore((state) => state.setFatalError);

  // Initialize stores (ONCE at top of component tree)
  useEffect(() => {
    const initStore = async () => {
      if (!isPinStoreInitialized) {
        const initStoreResponse = await initializePinStore();
        if (!initStoreResponse.isOk) {
          console.warn(initStoreResponse.uiMessage, initStoreResponse.messages);
          setPinStoreFatalError(initStoreResponse.uiMessage);
          // TODO: toast instead of fatal error?
        } else {
          console.debug(initStoreResponse.uiMessage, initStoreResponse.value, initStoreResponse.messages);
          // TODO: toast or set fatal error?
        }
      }
    };

    initStore();
  }, [isPinStoreInitialized, initializePinStore]);

  useEffect(() => {
    const initStore = async () => {
      if (!isUserPreferencesStoreInitialized) {
        const initStoreResponse = await initializeUserPreferencesStore();
        if (!initStoreResponse.isOk) {
          console.warn(initStoreResponse.uiMessage, initStoreResponse.messages);
          setUserPreferencesStoreFatalError(initStoreResponse.uiMessage);
          // TODO: toast instead of fatal error?
        } else {
          console.debug(initStoreResponse.uiMessage, initStoreResponse.value, initStoreResponse.messages);
          // TODO: toast or set fatal error?
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
        {pinMode !== "UNLOCKED" ? <LockedView /> : <UnlockedView />}
      </div>
      <Footer />
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
    <div className="flex flex-col gap-6 pt-20 w-full">
      <Step1 />
      <Step2 />
      <Step3 />
    </div>
  );
}
