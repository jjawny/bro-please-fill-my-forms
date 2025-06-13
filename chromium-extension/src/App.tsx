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
  const pinStatus = usePinStore((state) => state.pinStatus);

  const initializeUserPreferencesStore = useUserPreferencesStore((state) => state.initialize);
  const isUserPreferencesStoreInitialized = useUserPreferencesStore((state) => state.isInitialized);

  // Start listen to theme changes (ONCE at top of component tree)
  useTheme();

  // Initialize stores (ONCE at top of component tree)
  useEffect(() => {
    if (!isPinStoreInitialized) initializePinStore();
    if (!isUserPreferencesStoreInitialized) initializeUserPreferencesStore();
  }, [isPinStoreInitialized, isUserPreferencesStoreInitialized, initializePinStore, initializeUserPreferencesStore]);

  return (
    <div className="app-container">
      <div className="app-container-content">
        <ToggleLockButton />
        <ToggleThemeButton />
        {pinStatus !== "UNLOCKED" ? <LockedView /> : <UnlockedView />}
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
    <div className="flex flex-col gap-3 pt-20 w-full">
      <Step1 />
      <Step2 />
      <Step3 />
    </div>
  );
}
