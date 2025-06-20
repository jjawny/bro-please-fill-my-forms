import { cn } from "~/lib/utils/cn";
import logo from "/images/logo.png";

export default function HeroLogo({ heightPx, className }: { heightPx: number; className?: string }) {
  return (
    <div className={cn("select-none pointer-events-none", className)}>
      <img src={logo} alt="'Bro Please, Fill My Forms' logo" style={{ height: `${heightPx}px` }} />
    </div>
  );
}
