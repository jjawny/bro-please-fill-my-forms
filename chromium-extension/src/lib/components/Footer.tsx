import { usePinStore } from "~/lib/hooks/stores/usePinStore";
import { useUserPreferencesStore } from "~/lib/hooks/stores/useUserPreferencesStore";

export default function Footer() {
  const pinStoreFatalError = usePinStore((state) => state.fatalError);
  const userPreferencesStoreFatalError = useUserPreferencesStore((state) => state.fatalError);

  return (
    <footer className="flex-grow sticky items-end w-full flex z-[9999] justify-center">
      {/* TODO: make this nice for the user
      as this is a chrome extension, do we use toasts or just display the latest error at bottom of screen? (toasts are probably bad UX in chrome extensions) */}
      {pinStoreFatalError && <span className="text-red-500 ml-2">Pin Store Error: {pinStoreFatalError}</span>}
      {userPreferencesStoreFatalError && (
        <span className="text-red-500 ml-2">UserPreferences Store Error: {userPreferencesStoreFatalError}</span>
      )}
    </footer>
  );
}
