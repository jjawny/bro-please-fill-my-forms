import logo from "/images/logo.png";

export default function Hero() {
  return (
    <div className="relative select-none">
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
