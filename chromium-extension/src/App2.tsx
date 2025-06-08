import BetterStepOne from "./lib/ui/Better/BetterStepOne";
import Hero from "./lib/ui/Hero";

export default function App2() {
  return (
    <div className="container">
      <div className="grid-bg"></div>
      <div className="content">
        <Hero />
        <BetterStepOne />
      </div>
    </div>
  );
}
