import { useEffect } from "react";
import ChangeThemeButton from "~/lib/components/ChangeThemeButton";
import PadLockButton from "~/lib/components/PadLockButton";
import { usePinStore } from "~/lib/stores/PinStore";
import { useUserPreferencesStore } from "~/lib/stores/UserPreferencesStore";
import BetterStepOne from "~/lib/ui/Better/BetterStepOne";
import Hero from "~/lib/ui/Hero";

export default function App2() {
  const { initialize: initializePinStore, isInitialized: isPinStoreInitialized } = usePinStore();
  const { initialize: initializeUserPreferencesStore, isInitialized: isUserPreferencesStoreInitialized } = useUserPreferencesStore();

  // Initialize stores once for entire component tree
  useEffect(() => {
    if (!isPinStoreInitialized) initializePinStore();
    if (!isUserPreferencesStoreInitialized) initializeUserPreferencesStore();
  }, [isPinStoreInitialized, isUserPreferencesStoreInitialized, initializePinStore, initializeUserPreferencesStore]);

  return (
    <div className="app-container">
      <div className="app-container-background"></div>
      <div className="app-container-content">
        <PadLockButton />
        <ChangeThemeButton />
        <Hero />
        <BetterStepOne />
      </div>
    </div>
  );
}
