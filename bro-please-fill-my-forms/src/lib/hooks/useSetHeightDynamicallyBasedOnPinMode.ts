import { useEffect } from "react";
import { useGlobalStore } from "./stores/useGlobalStore";
import { usePinStore } from "./stores/usePinStore";

/**
 * Starts listening to the pin mode to adjust popup height for CRX content dynamically
 */
export function useSetHeightDynamicallyBasedOnPinMode() {
  const pinMode = usePinStore((state) => state.pinMode);
  const globalError = useGlobalStore((state) => state.globalError);

  useEffect(() => {
    const setPopUpHeight = (heightPx: number) => {
      document.documentElement.style.setProperty("--popup-height", `${heightPx}px`);
    };

    let finalHeight = globalError ? 20 : 0;

    if (pinMode === "SETTING_UP") {
      finalHeight += 240;
    } else if (pinMode === "LOCKED") {
      finalHeight += 320;
    } else if (pinMode === "UNLOCKED") {
      finalHeight += 370;
    }

    setPopUpHeight(finalHeight);
  }, [pinMode, globalError]);
}
