import { useEffect } from "react";
import { usePinStore } from "./stores/usePinStore";

/**
 * Starts listening to the pin mode to adjust popup height for CRX content dynamically
 */
export function useSetHeightDynamicallyBasedOnPinMode() {
  const pinMode = usePinStore((state) => state.pinMode);

  useEffect(() => {
    const setPopUpHeight = (heightPx: number) => {
      document.documentElement.style.setProperty("--popup-height", `${heightPx}px`);
    };

    if (pinMode === "SETTING_UP") {
      setPopUpHeight(260);
    } else if (pinMode === "LOCKED") {
      setPopUpHeight(320);
    } else if (pinMode === "UNLOCKED") {
      setPopUpHeight(400);
    }
  }, [pinMode]);
}
