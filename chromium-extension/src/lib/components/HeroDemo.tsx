import { CalendarIcon, DollarSignIcon, MailIcon, MapPinIcon, PhoneIcon, SignatureIcon } from "lucide-react";
import TypeWriter, { WordAndIcon } from "../components/TypeWriter";
import { cn } from "../utils/cn";

export default function HeroDemo() {
  const SHARED_STYLES = "right-0 absolute h-12 p-3 bg-white border border-stone-200 rounded-sm";
  const WORDS_AND_ICONS: WordAndIcon[] = [
    { word: "999,999,999,999", icon: <DollarSignIcon /> },
    { word: "Broski McBro", icon: <SignatureIcon /> },
    { word: "Broski.McBro@bro.com", icon: <MailIcon /> },
    { word: "-27.470605815771588, 153.0248755838874", icon: <MapPinIcon /> },
    { word: "1800-Broski", icon: <PhoneIcon /> },
    { word: "01/01/2000", icon: <CalendarIcon /> },
  ];
  return (
    <div className="relative">
      {/* Notification-style divs (stacked/fan) */}
      <div className={cn(SHARED_STYLES, "w-52 transform rotate-4 -translate-y-4 z-0")}></div>
      <div className={cn(SHARED_STYLES, "w-56 transform rotate-2 -translate-y-2 z-10")}></div>
      <div
        className={cn(SHARED_STYLES, "text-start flex gap-1 w-60 rounded-sm z-20 overflow-hidden whitespace-nowrap")}
      >
        <TypeWriter wordsAndIcons={WORDS_AND_ICONS} />
      </div>
    </div>
  );
}
