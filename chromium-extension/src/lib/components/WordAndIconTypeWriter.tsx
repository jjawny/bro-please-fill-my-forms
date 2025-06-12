import React from "react";
import { useTypewriter } from "../hooks/useTypeWriter";

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
    <div className="text-start flex gap-1 items-center">
      <span key={currentWordIndex} className="animate-bounce-in">
        {currentIcon}
      </span>
      {text}
    </div>
  );
}
