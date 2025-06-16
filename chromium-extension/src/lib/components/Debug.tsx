import { CodeIcon } from "lucide-react";
import { usePinStore } from "~/lib/hooks/stores/usePinStore";
import { useUserPreferencesStore } from "~/lib/hooks/stores/useUserPreferencesStore";
import { useKeyboardShortcuts } from "~/lib/hooks/useKeyboardShortcuts";
import MenuWrapper, { MenuItem } from "./MenuWrapper";
import { RippleButton } from "./shadcn/ripple";

export default function Debug() {
  const pinStoreJson = usePinStore((state) => state.GET_DEBUG_JSON_DUMP);
  const userPreferencesStoreJson = useUserPreferencesStore((state) => state.GET_DEBUG_JSON_DUMP);

  const logPinStoreJson = () => console.debug("PinStore:", pinStoreJson());
  const logUserPreferencesJson = () => console.debug("UserPreferences:", userPreferencesStoreJson());

  useKeyboardShortcuts([
    {
      keys: ["control", "1"],
      callback: logPinStoreJson,
      description: "Log PinStore",
    },
    {
      keys: ["control", "2"],
      callback: logUserPreferencesJson,
      description: "Log UserPreferences",
    },
  ]);

  const menuItems: MenuItem[] = [
    {
      label: "Log PinStore",
      onClick: logPinStoreJson,
      shortcut: "⌃1",
    },
    {
      label: "Log UserPreferencesStore",
      onClick: logUserPreferencesJson,
      shortcut: "⌃2",
    },
  ];

  if (import.meta.env.VITE_SHOW_DEBUG_MENU === "false") {
    return null;
  }

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
