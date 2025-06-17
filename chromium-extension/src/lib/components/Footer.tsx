import { useGlobalStore } from "~/lib/hooks/stores/useGlobalStore";

/**
 * Place to log misc/generic/global errors rather than using toasts (as this is an extension)
 */
export default function Footer() {
  const globalError = useGlobalStore((state) => state.globalError);

  return (
    <footer className="flex-grow sticky items-end w-full flex z-[9999] justify-center">
      {globalError && <span className="text-red-500 ml-2">{globalError}</span>}
    </footer>
  );
}
