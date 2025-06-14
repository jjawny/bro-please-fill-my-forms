import { LockIcon, LockOpenIcon } from "lucide-react";
import { RippleButton } from "~/lib/components/shadcn/ripple";
import { usePinStore } from "~/lib/stores/PinStore";

export default function ToggleLockButton() {
  const pinMode = usePinStore((state) => state.pinMode);
  const lock = usePinStore((state) => state.lock);

  const handleClick = async () => {
    const lockResponse = await lock();
    console.debug("Lock response:", lockResponse);
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
