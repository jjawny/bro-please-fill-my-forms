import { CodeIcon } from "lucide-react";
import { usePinStore } from "~/lib/hooks/stores/usePinStore";
import { useUserPreferencesStore } from "~/lib/hooks/stores/useUserPreferencesStore";
import MenuWrapper, { MenuItem } from "./MenuWrapper";
import { RippleButton } from "./shadcn/ripple";

export default function Debug() {
  const pinStoreJson = usePinStore((state) => state.GET_DEBUG_JSON_DUMP);
  const userPreferencesStoreJson = useUserPreferencesStore((state) => state.GET_DEBUG_JSON_DUMP);

  const menuItems: MenuItem[] = [
    {
      label: "Log PinStore",
      onClick: () => console.debug("PinStore:", pinStoreJson()),
    },
    {
      label: "Log UserPreferencesStore",
      onClick: () => console.debug("UserPreferencesStore:", userPreferencesStoreJson()),
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
