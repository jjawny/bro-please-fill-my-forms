import HeroDemo from "../components/HeroDemo";
import { cn } from "../utils/cn";
import logo from "/images/logo.png";

export default function Hero() {
  return (
    <div
      className={cn(
        "relative  w-[300px] mr-[50px] h-[100px]",
        // "bg-lime-300", // FOR DEBUGGING POSITION
      )}
    >
      <HeroDemo />
      <div className="select-none absolute top-[-50px] right-[-66px] z-50">
        <img src={logo} className="max-h-32" alt="TODO: name of app + logo" />
      </div>
    </div>
  );
}
