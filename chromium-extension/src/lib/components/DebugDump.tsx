import { usePinStore } from "../stores/PinStore";
import { useUserPreferencesStore } from "../stores/UserPreferencesStore";

const SHARED_STYLES = "text-left select-text z-[9999] text-xs max-w-[200px] overflow-x-scroll";
export default function DebugDump() {
  const pinStoreJson = usePinStore((state) => state.GET_DEBUG_JSON_DUMP);
  const userPreferencesStoreJson = useUserPreferencesStore((state) => state.GET_DEBUG_JSON_DUMP);

  // TODO: move to dialog?
  return (
    <>
      <pre className={SHARED_STYLES}>{pinStoreJson()}</pre>
      <pre className={SHARED_STYLES}>{userPreferencesStoreJson()}</pre>
    </>
  );
}
