import { LockIcon, LockOpenIcon } from "lucide-react";
import { usePinStore } from "~/lib/stores/PinStore";
import { RippleButton } from "../ui/shadcn/ripple";

export default function ToggleLockButton() {
  const pinStatus = usePinStore((state) => state.pinStatus);
  const lock = usePinStore((state) => state.lock);

  const handleClick = async () => {
    const lockResponse = await lock();
    console.debug("Lock response:", lockResponse);
  };

  if (pinStatus === "SETTING_UP") {
    return null;
  }

  return (
    <RippleButton
      title="Lock"
      onClick={handleClick}
      disabled={pinStatus !== "UNLOCKED"}
      variant="secondary"
      size="icon"
      className="size-8 absolute top-0 left-0 z-50 m-2"
    >
      {pinStatus === "LOCKED" ? <LockIcon /> : <LockOpenIcon />}
    </RippleButton>
  );
}
