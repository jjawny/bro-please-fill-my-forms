import React from "react";
import { useTypewriter } from "../hooks/useTypeWriter";
import { cn } from "../utils/cn";

export type WordAndIcon = {
  word: string;
  icon?: React.ReactNode;
};

export default function WordAndIconTypeWriter({
  wordsAndIcons = [{ word: "Hello" }],
}: {
  wordsAndIcons: WordAndIcon[];
}) {
  const { text, currentWordIndex } = useTypewriter({
    words: wordsAndIcons.map((wi) => wi.word),
    pauseTimeAfterDeleting: 100,
  });

  const currentIcon = wordsAndIcons[currentWordIndex]?.icon;

  return (
    <div className={cn("text-start text-sm", "flex gap-1 items-center")}>
      <span key={currentWordIndex} className={cn("[&_svg]:h-[1rem]", "animate-bounce-in")}>
        {currentIcon}
      </span>
      {text}
    </div>
  );
}
