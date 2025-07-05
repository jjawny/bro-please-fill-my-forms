import { CodeIcon } from "lucide-react";
import { ModifierKey } from "~/lib/enums/ModifierKey";
import { useGlobalStore } from "~/lib/hooks/stores/useGlobalStore";
import { usePinStore } from "~/lib/hooks/stores/usePinStore";
import { useUserPreferencesStore } from "~/lib/hooks/stores/useUserPreferencesStore";
import { useKeyboardShortcuts } from "~/lib/hooks/useKeyboardShortcuts";
import MenuWrapper, { MenuItem } from "./MenuWrapper";
import { RippleButton } from "./shadcn/ripple";

/**
 * Debug UI during development only; shortcuts still work in production
 */
export default function Debug() {
  const getPinStoreDump = usePinStore((state) => state.GET_DEBUG_DUMP);
  const getUserPreferencesStoreDump = useUserPreferencesStore((state) => state.GET_DEBUG_DUMP);
  const getGlobalStoreDump = useGlobalStore((state) => state.GET_DEBUG_DUMP);

  const logPinStoreJson = () => {
    console.debug("PinStore:", getPinStoreDump());
    console.debug("UserPreferencesStore:", getUserPreferencesStoreDump());
    console.debug("GlobalStore:", getGlobalStoreDump());
  };

  useKeyboardShortcuts([{ keys: [ModifierKey.CONTROL, "1"], callback: logPinStoreJson }]);

  const menuItems: MenuItem[] = [{ label: "Log all state", onClick: logPinStoreJson, shortcut: "⌃1" }];

  return (
    <MenuWrapper
      side="left"
      align="end"
      menuLabel="Debug Tools"
      items={menuItems}
      trigger={
        <RippleButton
          title="Open Debug Tools Menu"
          size="icon"
          variant="secondary"
          aria-label="Open Debug Tools Menu"
          className="size-8 absolute bottom-0 left-0 z-50 m-2"
        >
          <CodeIcon />
        </RippleButton>
      }
    />
  );
}
