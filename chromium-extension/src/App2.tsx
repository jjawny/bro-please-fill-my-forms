import ChangeThemeButton from "./lib/components/ChangeThemeButton";
import PadLockButton from "./lib/components/PadLockButton";
import BetterStepOne from "./lib/ui/Better/BetterStepOne";
import Hero from "./lib/ui/Hero";

export default function App2() {
  return (
    <div className="container relative">
      <div className="grid-bg"></div>
      <div className="content">
        <PadLockButton />
        <ChangeThemeButton />
        <Hero />
        <BetterStepOne />
      </div>
    </div>
  );
}
