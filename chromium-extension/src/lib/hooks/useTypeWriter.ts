import { useCallback, useEffect, useRef, useState } from "react";

export function useTypewriter(args: {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseTime?: number;
  pauseTimeAfterTyping?: number;
  pauseTimeAfterDeleting?: number;
}) {
  const {
    words,
    typingSpeed = 100,
    deletingSpeed = 50,
    pauseTime = 1000,
    pauseTimeAfterTyping,
    pauseTimeAfterDeleting,
  } = args;

  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanUp = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const currWord = words[wordIndex];

    const scheduleNextAction = (delay: number, action: () => void) => {
      cleanUp();
      timeoutRef.current = setTimeout(action, delay);
    };

    const getAction = () => {
      if (!isDeleting && charIndex < currWord.length) return "TYPING";
      if (!isDeleting && charIndex === currWord.length) return "AFTER_TYPING_PAUSE";
      if (isDeleting && charIndex > 0) return "DELETING";
      if (isDeleting && charIndex === 0) return "AFTER_DELETING_PAUSE_AND_MOVE_TO_NEXT_WORD";
      return "idle";
    };

    switch (getAction()) {
      case "TYPING":
        scheduleNextAction(typingSpeed, () => setCharIndex((prev) => prev + 1));
        break;

      case "AFTER_TYPING_PAUSE":
        scheduleNextAction(pauseTimeAfterTyping ?? pauseTime, () => setIsDeleting(true));
        break;

      case "DELETING":
        scheduleNextAction(deletingSpeed, () => setCharIndex((prev) => prev - 1));
        break;

      case "AFTER_DELETING_PAUSE_AND_MOVE_TO_NEXT_WORD":
        scheduleNextAction(pauseTimeAfterDeleting ?? pauseTime, () => {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        });
        break;

      default:
        break;
    }

    setText(currWord.slice(0, charIndex));

    return cleanUp;
  }, [charIndex, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, pauseTime, cleanUp]);

  return { text, currentWordIndex: wordIndex };
}
