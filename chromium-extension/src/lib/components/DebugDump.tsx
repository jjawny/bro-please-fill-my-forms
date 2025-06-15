import { usePinStore } from "~/lib/hooks/stores/usePinStore";
import { useUserPreferencesStore } from "~/lib/hooks/stores/useUserPreferencesStore";

const SHARED_STYLES = "text-left select-text z-[9999] text-xs max-w-[200px] overflow-x-scroll";

export default function DebugDump() {
  const pinStoreJson = usePinStore((state) => state.GET_DEBUG_JSON_DUMP);
  const userPreferencesStoreJson = useUserPreferencesStore((state) => state.GET_DEBUG_JSON_DUMP);

  // TODO: move to dialog?
  // TODO: this isn't re-rendering when the store changes FYI, it just gets a snapshot so maybe this should be a dialog when open takes a snapshot? and renders?
  return (
    <>
      <pre className={SHARED_STYLES}>{pinStoreJson()}</pre>
      <pre className={SHARED_STYLES}>{userPreferencesStoreJson()}</pre>
    </>
  );
}
