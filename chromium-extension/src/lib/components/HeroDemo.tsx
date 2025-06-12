import { CalendarIcon, DollarSignIcon, MailIcon, MapPinIcon, PhoneIcon, SignatureIcon } from "lucide-react";
import { cn } from "~/lib/utils/cn";
import WordAndIconTypeWriter, { WordAndIcon } from "./WordAndIconTypeWriter";

const SHARED_STYLES = "right-0 absolute h-12 p-3 bg-white border border-stone-200 rounded-sm";
const WORDS_AND_ICONS: WordAndIcon[] = [
  { word: "999,999,999,999", icon: <DollarSignIcon /> },
  { word: "Broski McBro", icon: <SignatureIcon size="1rem" /> },
  { word: "Broski.McBro@bro.com", icon: <MailIcon /> },
  { word: "-27.470605815771588, 153.0248755838874", icon: <MapPinIcon /> },
  { word: "1800-Broski", icon: <PhoneIcon /> },
  { word: "01/01/2000", icon: <CalendarIcon /> },
];

/**
 * Notification-style inputs (stacked/fan)
 */
export default function HeroDemo() {
  return (
    <div className="relative">
      <div className={cn(SHARED_STYLES, "w-52", "z-0", "transform rotate-6 -translate-y-4")}></div>
      <div className={cn(SHARED_STYLES, "w-56", "z-10", "transform rotate-4 -translate-y-2")}></div>
      <div className={cn(SHARED_STYLES, "w-60", "z-20", "transform rotate-2")}></div>
      <div
        className={cn(
          SHARED_STYLES,
          "w-56",
          "z-10",
          "transform -rotate-4 translate-y-8",
          "text-start flex gap-1 overflow-hidden whitespace-nowrap",
          "!pr-0 !pl-1 !py-0 !h-7", // override shared
        )}
      >
        <WordAndIconTypeWriter wordsAndIcons={WORDS_AND_ICONS} />
      </div>
    </div>
  );
}
