import { LoaderCircleIcon } from "lucide-react";
import { cn } from "~/lib/utils/cn";

export default function Spinner({ widthPx = 16, className }: { widthPx?: number; className?: string }) {
  return (
    <LoaderCircleIcon
      className={cn(className, "animate-spin")}
      style={{ width: `${widthPx}px`, height: `${widthPx}px` }}
    />
  );
}
