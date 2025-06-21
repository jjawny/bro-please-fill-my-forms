import React from "react";
import { useTypewriter } from "~/lib/hooks/useTypeWriter";
import { cn } from "~/lib/utils/cn";

export type TextIconPair = {
  text: string;
  icon?: React.ReactNode;
};

export default function TextIconPairTypeWriter({
  pairs = [{ text: "Hello" }],
  className,
}: {
  pairs: TextIconPair[];
  className?: string;
}) {
  const { text, currentWordIndex } = useTypewriter({
    words: pairs.map((p) => p.text),
    pauseTimeAfterDeleting: 100,
  });

  const currentIcon = pairs[currentWordIndex]?.icon;

  return (
    <div className={cn(className, "flex overflow-hidden", "text-start text-sm whitespace-nowrap")}>
      <span className={cn("opacity-30", "flex gap-1 items-center")}>
        <span key={currentWordIndex} className={cn("[&_svg]:h-[1rem]", "animate-bounce-in")}>
          {currentIcon}
        </span>
        {text}
      </span>
    </div>
  );
}
