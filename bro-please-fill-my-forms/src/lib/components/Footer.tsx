import { useGlobalStore } from "~/lib/hooks/stores/useGlobalStore";

/**
 * Place to log misc/generic/global errors rather than using toasts (as this is a CRX)
 */
export default function Footer() {
  const globalError = useGlobalStore((state) => state.globalError);

  return (
    <footer className="flex-grow sticky items-end w-full flex justify-center h-4">
      {globalError && <span className="text-red-500 text-sm">{globalError}</span>}
    </footer>
  );
}
