import { LockIcon, LockOpenIcon } from "lucide-react";
import { usePinStore } from "~/lib/stores/PinStore";
import { RippleButton } from "../ui/shadcn/ripple";

export default function ToggleLockButton() {
  const { pinStatus, lock } = usePinStore();

  if (pinStatus === "SETTING_UP") {
    return null;
  }

  return (
    <RippleButton
      onClick={lock}
      disabled={pinStatus !== "UNLOCKED"}
      variant="secondary"
      size="icon"
      className="size-8 absolute top-0 left-0 z-50 m-2"
    >
      {" "}
      {pinStatus === "LOCKED" ? <LockIcon /> : <LockOpenIcon />}
    </RippleButton>
  );
}
