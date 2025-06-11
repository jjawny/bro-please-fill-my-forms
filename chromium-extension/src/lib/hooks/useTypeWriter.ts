import { useEffect, useRef, useState } from "react";

export function useTypewriter(args: {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseTime?: number;
}): string {
  const { words, typingSpeed = 100, deletingSpeed = 50, pauseTime = 1000 } = args;
  const [text, setText] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const currWord = words[wordIdx];

    // Typing Phase
    if (!isPaused && !isDeleting) {
      if (charIdx < currWord.length) {
        timeoutRef.current = setTimeout(() => setCharIdx((prev) => prev + 1), typingSpeed);
      } else {
        setIsPaused(true);
      }
    }

    // Deleting Phase
    if (!isPaused && isDeleting) {
      if (charIdx > 0) {
        timeoutRef.current = setTimeout(() => setCharIdx((prev) => prev - 1), deletingSpeed);
      } else {
        setIsPaused(true);
        setWordIdx((prev) => (prev + 1) % words.length); // cycle through words after each delete phase
      }
    }

    if (!isPaused) setText(currWord.slice(0, charIdx)); // update text to display

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charIdx, isDeleting, wordIdx, words, typingSpeed, deletingSpeed]);

  useEffect(
    function HandlePause() {
      const UnPause = () => {
        setIsPaused(false);
        setIsDeleting((prev) => !prev);
      };

      if (isPaused) timeoutRef.current = setTimeout(() => UnPause(), pauseTime);

      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    },
    [isPaused, pauseTime],
  );

  return text;
}
