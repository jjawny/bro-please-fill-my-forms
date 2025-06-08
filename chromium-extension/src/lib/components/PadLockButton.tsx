import { LockIcon, LockOpenIcon } from "lucide-react";
import { usePinStore } from "~/lib/stores/PinStore";
import { Button } from "~/lib/ui/shadcn/button";

export default function PadLockButton() {
  const { pinStatus, lock } = usePinStore();

  if (pinStatus === "SETTING_UP") {
    return null;
  }

  return (
    <Button onClick={lock} disabled={pinStatus !== "UNLOCKED"} variant="secondary" size="icon" className="size-8 absolute top-0 left-0 z-50">
      {pinStatus === "LOCKED" ? <LockIcon /> : <LockOpenIcon />}
    </Button>
  );
}
