import HeroDemo from "~/lib/components/HeroDemo";
import { cn } from "~/lib/utils/cn";
import logo from "/images/logo.png";

export default function Hero() {
  return (
    <div
      className={cn(
        "relative",
        "w-[300px] h-[80px] mt-[80px] mr-[50px]",
        // "bg-lime-300", // FOR DEBUGGING THE POSITION
      )}
    >
      <HeroDemo />
      <HeroLogo />
    </div>
  );
}

function HeroLogo() {
  return (
    <div className="select-none absolute top-[-60px] right-[-66px] z-50">
      <img src={logo} alt="Bro Please, Fill My Forms logo" className="max-h-32" />
    </div>
  );
}
