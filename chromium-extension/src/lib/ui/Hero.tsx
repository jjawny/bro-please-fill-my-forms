import TypeWriter from "../components/TypeWriter";
import logo from "/images/logo.png";

export default function Hero() {
  return (
    <div className="relative select-none pb-10">
      <StackedInputs />
      <h1 className="flex tracking-tight space-x-5">
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
      </h1>
      <div className="absolute -top-[30px] -left-[68px]">
        <img src={logo} style={{ maxHeight: "6rem" }} alt="Logo logo" />
      </div>
    </div>
  );
}

function StackedInputs() {
  return (
    <div className="relative">
      {/* Notification-style divs - stacked/fan */}
      <div className="absolute w-60 h-12 p-3 bg-gray-100 border border-gray-300 rounded-sm transform rotate-3 translate-x-2 -translate-y-4 z-0"></div>
      <div className="absolute w-60 h-12 p-3 bg-blue-50 border border-blue-200 rounded-sm transform rotate-1 translate-x-1 -translate-y-2 z-10"></div>

      {/* Front input with typewriter animation */}
      <div className="absolute w-60 h-12 p-3 border-stone-200 border bg-white rounded-sm z-20 overflow-hidden whitespace-nowra transform -rotate-1">
        <TypeWriter text={["test ts tset"]} />
      </div>
    </div>
  );
}
