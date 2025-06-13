import { CalendarIcon, DollarSignIcon, MailIcon, MapPinIcon, PhoneIcon, SignatureIcon } from "lucide-react";
import TextIconPairTypeWriter, { TextIconPair } from "~/lib/components/WordAndIconTypeWriter";
import { cn } from "~/lib/utils/cn";

const SHARED_STYLES = "select-none h-7 pl-1 right-0 absolute bg-white border border-stone-200 rounded-sm";

const WORDS_AND_ICONS_GROUP_1: TextIconPair[] = [
  { text: "999,999,999,999", icon: <DollarSignIcon /> },
  { text: "Broski McBro", icon: <SignatureIcon size="1rem" /> },
];

const WORDS_AND_ICONS_GROUP_2: TextIconPair[] = [
  { text: "1800-Broski", icon: <PhoneIcon /> },
  { text: "Broski.McBro@bro.com", icon: <MailIcon /> },
];

const WORDS_AND_ICONS_GROUP_3: TextIconPair[] = [
  { text: "-33.7673, 151.0499", icon: <MapPinIcon /> },
  { text: "01/01/2000", icon: <CalendarIcon /> },
];

/**
 * Notification-style inputs (stacked/fan)
 */
export default function HeroDemo() {
  return (
    <div className="relative">
      <TextIconPairTypeWriter
        className={cn(SHARED_STYLES, "w-55", "-z-10", "transform rotate-19 -translate-y-9")}
        pairs={WORDS_AND_ICONS_GROUP_3}
      />
      <TextIconPairTypeWriter
        className={cn(SHARED_STYLES, "w-60", "z-0", "transform rotate-13 -translate-y-6")}
        pairs={WORDS_AND_ICONS_GROUP_2}
      />
      <TextIconPairTypeWriter
        className={cn(SHARED_STYLES, "w-64", "z-10", "transform rotate-7 -translate-y-3")}
        pairs={WORDS_AND_ICONS_GROUP_1}
      />
      <div className={cn(SHARED_STYLES, "w-fit", "z-20", "transform -rotate-0", "!h-fit !p-3")}>
        <HeroTitle />
      </div>
    </div>
  );
}

function HeroTitle() {
  return <h1 className="text-xl select-text text-black whitespace-nowrap font-extrabold">BRO PLEASE, FILL MY FORMS</h1>;
}
