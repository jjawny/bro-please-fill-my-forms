import { useEffect } from "react";
import Hero from "~/lib/components/Hero";
import PinWrapper from "~/lib/components/PinWrapper";
import ToggleLockButton from "~/lib/components/ToggleLockButton";
import ToggleThemeButton from "~/lib/components/ToggleThemeButton";
import { usePinStore } from "~/lib/stores/PinStore";
import { useUserPreferencesStore } from "~/lib/stores/UserPreferencesStore";
import Footer from "./lib/components/Footer";

export default function App2() {
  const { initialize: initializePinStore, isInitialized: isPinStoreInitialized, pinStatus } = usePinStore();
  const { initialize: initializeUserPreferencesStore, isInitialized: isUserPreferencesStoreInitialized } =
    useUserPreferencesStore();

  // Initialize stores once for entire component tree
  useEffect(() => {
    if (!isPinStoreInitialized) initializePinStore();
    if (!isUserPreferencesStoreInitialized) initializeUserPreferencesStore();
  }, [isPinStoreInitialized, isUserPreferencesStoreInitialized, initializePinStore, initializeUserPreferencesStore]);

  return (
    <div className="app-container">
      <div className="app-container-background"></div>
      <div className="app-container-content">
        <ToggleLockButton />
        <ToggleThemeButton />
        {pinStatus !== "UNLOCKED" ? (
          <>
            <Hero />
            <PinWrapper />
          </>
        ) : (
          <p>TODO: actual step 1</p>
        )}
      </div>
      <Footer />
    </div>
  );
}
