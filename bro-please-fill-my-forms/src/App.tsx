import { useEffect } from "react";
import AppContent from "~/lib/components/AppContent";
import Debug from "~/lib/components/Debug";
import Footer from "~/lib/components/Footer";
import GitHubLink from "~/lib/components/GitHubLink";
import MiniHero from "~/lib/components/MiniHero";
import ToggleLockButton from "~/lib/components/ToggleLockButton";
import ToggleThemeButton from "~/lib/components/ToggleThemeButton";
import { useGlobalStore } from "~/lib/hooks/stores/useGlobalStore";
import { usePinStore } from "~/lib/hooks/stores/usePinStore";
import { useUserPreferencesStore } from "~/lib/hooks/stores/useUserPreferencesStore";
import { useSetHeightDynamicallyBasedOnPinMode } from "~/lib/hooks/useSetHeightDynamicallyBasedOnPinMode";
import { logResponse } from "~/lib/utils/log-utils";

export default function App() {
  const setGlobalError = useGlobalStore((state) => state.setGlobalError);

  const initializePinStore = usePinStore((state) => state.initialize);
  const isPinStoreInitialized = usePinStore((state) => state.isInitialized);
  const pinMode = usePinStore((state) => state.pinMode);

  const initializeUserPreferencesStore = useUserPreferencesStore((state) => state.initialize);
  const isUserPreferencesStoreInitialized = useUserPreferencesStore((state) => state.isInitialized);

  const initializeGloablStore = useGlobalStore((state) => state.initialize);
  const isGlobalStoreInitialized = useGlobalStore((state) => state.isInitialized);

  // Start listening/reacting to pin mode; updating popup height dynamically
  useSetHeightDynamicallyBasedOnPinMode();

  // Initialize all stores ONCE at top of component tree
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
  }, [isPinStoreInitialized, initializePinStore, setGlobalError]);

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
  }, [isUserPreferencesStoreInitialized, initializeUserPreferencesStore, setGlobalError]);

  useEffect(() => {
    const initStore = async () => {
      if (!isGlobalStoreInitialized) {
        const initStoreResponse = await initializeGloablStore();

        logResponse(initStoreResponse);

        if (!initStoreResponse.isOk) {
          setGlobalError(initStoreResponse.uiMessage);
        }
      }
    };

    initStore();
  }, [isGlobalStoreInitialized, initializeGloablStore, setGlobalError]);

  return (
    <div className="app-container">
      <div className="app-container-content">
        <ToggleLockButton />
        {pinMode === "UNLOCKED" && <MiniHero />}
        <ToggleThemeButton />
        <DebugComponents />
        <AppContent />
        <Footer />
      </div>
    </div>
  );
}

function DebugComponents() {
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <>
      <Debug />
      <GitHubLink />
    </>
  );
}
