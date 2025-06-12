import { useCallback, useEffect, useRef, useState } from "react";

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

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanUp = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const currWord = words[wordIdx];

    const scheduleNextAction = (delay: number, action: () => void) => {
      cleanUp();
      timeoutRef.current = setTimeout(action, delay);
    };

    const getAction = () => {
      if (!isDeleting && charIdx < currWord.length) return "TYPING";
      if (!isDeleting && charIdx === currWord.length) return "AFTER_TYPING_PAUSE";
      if (isDeleting && charIdx > 0) return "DELETING";
      if (isDeleting && charIdx === 0) return "AFTER_DELETING_PAUSE_AND_MOVE_TO_NEXT_WORD";
      return "idle";
    };

    switch (getAction()) {
      case "TYPING":
        scheduleNextAction(typingSpeed, () => setCharIdx((prev) => prev + 1));
        break;

      case "AFTER_TYPING_PAUSE":
        scheduleNextAction(pauseTime, () => setIsDeleting(true));
        break;

      case "DELETING":
        scheduleNextAction(deletingSpeed, () => setCharIdx((prev) => prev - 1));
        break;

      case "AFTER_DELETING_PAUSE_AND_MOVE_TO_NEXT_WORD":
        scheduleNextAction(pauseTime, () => {
          setIsDeleting(false);
          setWordIdx((prev) => (prev + 1) % words.length);
        });
        break;

      default:
        break;
    }

    setText(currWord.slice(0, charIdx));

    return cleanUp;
  }, [charIdx, isDeleting, wordIdx, words, typingSpeed, deletingSpeed, pauseTime, cleanUp]);

  return text;
}
