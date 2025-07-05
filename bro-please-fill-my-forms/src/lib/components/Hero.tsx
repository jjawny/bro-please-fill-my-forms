import HeroDemo from "~/lib/components/HeroDemo";
import { cn } from "~/lib/utils/cn";
import HeroLogo from "./HeroLogo";

export default function Hero() {
  return (
    <div
      className={cn(
        "relative",
        "w-[300px] h-[75px] mt-[45px] mr-[45px]",
        // "bg-lime-300", // FOR DEBUGGING THE POSITION
      )}
    >
      <HeroDemo />
      <HeroLogo heightPx={128} className="absolute top-[-60px] right-[-66px] z-50" />
    </div>
  );
}
