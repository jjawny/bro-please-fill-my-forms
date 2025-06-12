import { useState } from "react";
import { Button } from "./shadcn/button";
import ToolTipWrapper from "./ToolTipWrapper";

export default function ApiKeyField() {
  const [, setIsUnlocked] = useState<boolean>(false);
  const [, setEncryptedApiKey] = useState<string>("");
  const [, setDecryptedApiKey] = useState<string>("");
  const [, setEnteredPin] = useState<string>("");
  const [, setApiKeyInput] = useState<string>("");

  const handleClear = () => {
    setEncryptedApiKey("");
    setDecryptedApiKey("");
    setApiKeyInput("");
    setIsUnlocked(false);
    setEnteredPin("");
  };

  return (
    <>
      {/* <PassCode
        isPlayShakeAnimation={isShaking}
        onComplete={handlePinSubmit}
        error={passCodeError}
      /> */}
      <p className="pt-2">
        <ToolTipWrapper content="You will need to re-enter your API key again" backgroundColorHex="#ff0000">
          <span>
            <Button onClick={handleClear} size="sm" className="text-black">
              Forgot your PIN?
            </Button>
          </span>
        </ToolTipWrapper>
      </p>
    </>
  );
}
