import { usePinStore } from "~/lib/hooks/stores/usePinStore";
import { useUserPreferencesStore } from "~/lib/hooks/stores/useUserPreferencesStore";

/**
 * Place to log misc/generic/global errors rather than using toasts (as this is an extension)
 */
export default function Footer() {
  const pinStoreGlobalError = usePinStore((state) => state.globalError);
  const userPreferencesStoreGlobalError = useUserPreferencesStore((state) => state.globalError);

  return (
    <footer className="flex-grow sticky items-end w-full flex z-[9999] justify-center">
      {pinStoreGlobalError && <span className="text-red-500 ml-2">Pin Store Error: {pinStoreGlobalError}</span>}
      {userPreferencesStoreGlobalError && (
        <span className="text-red-500 ml-2">UserPreferences Store Error: {userPreferencesStoreGlobalError}</span>
      )}
    </footer>
  );
}
