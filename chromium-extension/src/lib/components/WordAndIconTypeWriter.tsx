import React from "react";
import { useTypewriter } from "../hooks/useTypeWriter";
import { cn } from "../utils/cn";

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
    <div
      className={cn(
        className,
        "flex gap-1 items-center overflow-hidden",
        "text-start text-sm text-stone-300 whitespace-nowrap",
      )}
    >
      <span key={currentWordIndex} className={cn("[&_svg]:h-[1rem]", "animate-bounce-in")}>
        {currentIcon}
      </span>
      {text}
    </div>
  );
}
