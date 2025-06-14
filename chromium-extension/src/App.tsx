import { useEffect } from "react";
import Footer from "~/lib/components/Footer";
import Hero from "~/lib/components/Hero";
import PinWrapper from "~/lib/components/PinWrapper";
import Step1 from "~/lib/components/Step1";
import Step2 from "~/lib/components/Step2";
import Step3 from "~/lib/components/Step3";
import ToggleLockButton from "~/lib/components/ToggleLockButton";
import ToggleThemeButton from "~/lib/components/ToggleThemeButton";
import { useTheme } from "~/lib/hooks/useTheme";
import { usePinStore } from "~/lib/stores/PinStore";
import { useUserPreferencesStore } from "~/lib/stores/UserPreferencesStore";

export default function App() {
  const initializePinStore = usePinStore((state) => state.initialize);
  const isPinStoreInitialized = usePinStore((state) => state.isInitialized);
  const setPinStoreFatalError = usePinStore((state) => state.setFatalError);
  const pinMode = usePinStore((state) => state.pinMode);

  const initializeUserPreferencesStore = useUserPreferencesStore((state) => state.initialize);
  const isUserPreferencesStoreInitialized = useUserPreferencesStore((state) => state.isInitialized);
  const setUserPreferencesStoreFatalError = useUserPreferencesStore((state) => state.setFatalError);

  // Start listen to theme changes (ONCE at top of component tree)
  useTheme();

  // Initialize stores (ONCE at top of component tree)
  useEffect(() => {
    const initStores = async () => {
      if (!isPinStoreInitialized) {
        const initStoreResponse = await initializePinStore();
        if (!initStoreResponse.isOk) {
          console.warn(initStoreResponse.error, initStoreResponse.messages);
          setPinStoreFatalError(initStoreResponse.error);
          // TODO: toast instead of fatal error?
        } else {
          console.debug(initStoreResponse.value, initStoreResponse.messages);
          // TODO: toast or set fatal error?
        }
      }
      if (!isUserPreferencesStoreInitialized) {
        const initStoreResponse = await initializeUserPreferencesStore();
        if (!initStoreResponse.isOk) {
          console.warn(initStoreResponse.error, initStoreResponse.messages);
          setUserPreferencesStoreFatalError(initStoreResponse.error);
          // TODO: toast instead of fatal error?
        } else {
          console.debug(initStoreResponse.value, initStoreResponse.messages);
          // TODO: toast or set fatal error?
        }
      }
    };

    initStores();
  }, [isPinStoreInitialized, isUserPreferencesStoreInitialized, initializePinStore, initializeUserPreferencesStore]);

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
