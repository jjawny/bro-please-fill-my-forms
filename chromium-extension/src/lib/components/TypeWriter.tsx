import React from "react";
import { useTypewriter } from "../hooks/useTypeWriter";

interface TypewriterProps {
  text: string[];
}

const TypeWriter: React.FC<TypewriterProps> = ({ text = ["Hello"] }) => {
  const wordss = useTypewriter({
    words: text,
  });

  return (
    <div>
      <style></style>
      {wordss} <span className="cursor">|</span>
    </div>
  );
};

export default TypeWriter;
