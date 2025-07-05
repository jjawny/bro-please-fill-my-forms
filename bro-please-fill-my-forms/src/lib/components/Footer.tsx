import { XIcon } from "lucide-react";
import { useGlobalStore } from "~/lib/hooks/stores/useGlobalStore";
import { RippleButton } from "./shadcn/ripple";

/**
 * Place to display misc/generic/global errors rather than using toasts (as this is a CRX)
 */
export default function Footer() {
  const globalError = useGlobalStore((state) => state.globalError);
  const setGlobalError = useGlobalStore((state) => state.setGlobalError);

  const clearGlobalError = () => {
    setGlobalError(undefined);
  };
  return (
    <footer className="flex-grow sticky items-end w-[80%] flex justify-center max-h-4">
      {globalError && (
        <div className="flex items-center gap-1">
          <span className="text-red-500 text-sm">{globalError}</span>
          <RippleButton
            title="Close error"
            size="icon"
            variant="destructive"
            onClick={clearGlobalError}
            className="size-5"
          >
            <XIcon />
          </RippleButton>
        </div>
      )}
    </footer>
  );
}
