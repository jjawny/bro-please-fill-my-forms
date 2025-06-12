import HeroDemo from "../components/HeroDemo";
import { cn } from "../utils/cn";
import logo from "/images/logo.png";
export default function Hero() {
  return (
    <div
      className={cn(
        "relative  w-[300px] pb-[300px]",
        // "bg-pink-200"
      )}
    >
      <HeroDemo />
      {/* <h1 className="flex tracking-tight space-x-5">
        <span>
          <span className="font-black">F</span>
          <span className="font-extrabold">I</span>
          <span className="font-bold">L</span>
          <span className="font-semibold">L</span>
          <span className="font-medium">A</span>
        </span>
        <span>
          <span className="font-normal">M</span>
          <span className="font-light">Y</span>
        </span>
        <span>
          <span className="font-extralight">F</span>
          <span className="font-thin">O</span>
          <span className="font-thin">R</span>
          <span className="font-thin">M</span>
        </span>
      </h1> */}
      <div className="select-none absolute top-[-50px] right-[-66px] z-50">
        <img src={logo} style={{ maxHeight: "8rem" }} alt="Logo logo" />
      </div>
    </div>
  );
}
