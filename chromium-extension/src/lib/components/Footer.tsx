import { usePinStore } from "~/lib/hooks/stores/usePinStore";
import { useUserPreferencesStore } from "~/lib/hooks/stores/useUserPreferencesStore";

/**
 * Place to log misc/generic/global errors rather than using toasts (as this is an extension)
 */
export default function Footer() {
  const pinStoreFatalError = usePinStore((state) => state.fatalError);
  const userPreferencesStoreFatalError = useUserPreferencesStore((state) => state.fatalError);

  return (
    <footer className="flex-grow sticky items-end w-full flex z-[9999] justify-center">
      {pinStoreFatalError && <span className="text-red-500 ml-2">Pin Store Error: {pinStoreFatalError}</span>}
      {userPreferencesStoreFatalError && (
        <span className="text-red-500 ml-2">UserPreferences Store Error: {userPreferencesStoreFatalError}</span>
      )}
    </footer>
  );
}
