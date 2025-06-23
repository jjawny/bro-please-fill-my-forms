import { CalendarIcon, DollarSignIcon, MailIcon, MapPinIcon, PhoneIcon, SignatureIcon } from "lucide-react";
import TextIconPairTypeWriter, { TextIconPair } from "~/lib/components/WordAndIconTypeWriter";
import { useTypewriter } from "~/lib/hooks/useTypeWriter";
import { cn } from "~/lib/utils/cn";

const SHARED_STYLES =
  "select-none h-7 pl-1 right-0 absolute bg-[var(--hero-background-color)] border border-[var(--hero-border-color)] rounded-sm transform transition-transform ease-in-out";

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
    <div className="relative group">
      <TextIconPairTypeWriter
        pairs={WORDS_AND_ICONS_GROUP_3}
        className={cn(
          SHARED_STYLES,
          "w-55",
          "-z-10",
          "translate-x-5 -translate-y-2 rotate-9",
          "group-hover:rotate-15 group-hover:-translate-y-4.5",
          "duration-300",
        )}
      />
      <TextIconPairTypeWriter
        pairs={WORDS_AND_ICONS_GROUP_2}
        className={cn(
          SHARED_STYLES,
          "w-60",
          "z-0",
          "translate-x-5 -translate-y-1.5 rotate-6",
          "group-hover:rotate-10 group-hover:-translate-y-3.5",
          "duration-200",
        )}
      />
      <TextIconPairTypeWriter
        pairs={WORDS_AND_ICONS_GROUP_1}
        className={cn(
          SHARED_STYLES,
          "w-64",
          "z-10",
          "translate-x-5 -translate-y-1 rotate-3",
          "group-hover:rotate-5 group-hover:-translate-y-2",
          "duration-100",
        )}
      />
      <HeroTitle />
    </div>
  );
}

function HeroTitle() {
  const { text } = useTypewriter({
    words: ["BRO PLEASE, FILL MY FORMS"],
    pauseTimeAfterTyping: 5_000,
    pauseTimeAfterDeleting: 200,
  });

  return (
    <div className={cn(SHARED_STYLES, "w-fit", "z-20", "transform -rotate-0", "!h-fit !p-3")}>
      <h1 className="text-xl text-end select-text whitespace-nowrap font-extrabold w-[280px]">{text}&nbsp;</h1>
    </div>
  );
}
