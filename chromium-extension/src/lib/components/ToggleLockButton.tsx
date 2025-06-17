import { LockIcon, LockOpenIcon } from "lucide-react";
import { RippleButton } from "~/lib/components/shadcn/ripple";
import { useGlobalStore } from "~/lib/hooks/stores/useGlobalStore";
import { usePinStore } from "~/lib/hooks/stores/usePinStore";
import { logResponse } from "~/lib/utils/log-utils";

export default function ToggleLockButton() {
  const setGlobalError = useGlobalStore((state) => state.setGlobalError);

  const pinMode = usePinStore((state) => state.pinMode);
  const lock = usePinStore((state) => state.lock);

  const handleClick = async () => {
    const lockResponse = await lock();

    logResponse(lockResponse);

    if (!lockResponse.isOk) {
      setGlobalError(lockResponse.uiMessage);
    }
  };

  if (pinMode === "SETTING_UP") {
    return null;
  }

  return (
    <RippleButton
      title="Lock"
      size="icon"
      variant="secondary"
      disabled={pinMode !== "UNLOCKED"}
      onClick={handleClick}
      className="size-8 absolute top-0 left-0 z-50 m-2"
    >
      {pinMode === "LOCKED" ? <LockIcon /> : <LockOpenIcon />}
    </RippleButton>
  );
}
