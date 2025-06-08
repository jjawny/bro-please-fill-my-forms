import { useState } from "react";
import { decryptData } from "../utils/crypto";
import PassCode from "./PassCode";
import { Button } from "./shadcn/button";
import ToolTipWrapper from "./ToolTipWrapper";

const PIN = "1234";

export default function ApiKeyField() {
  const [, setIsUnlocked] = useState<boolean>(false);
  const [encryptedApiKey, setEncryptedApiKey] = useState<string>("");
  const [, setDecryptedApiKey] = useState<string>("");
  const [, setEnteredPin] = useState<string>("");
  const [, setApiKeyInput] = useState<string>("");
  const [passCodeError, setPassCodeError] = useState<string | undefined>();
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const handlePinSubmit = async (pin: string) => {
    if (pin === PIN) {
      setIsShaking(false);
      setEnteredPin(pin);
      if (encryptedApiKey) {
        // Decrypt existing key
        try {
          const decrypted = await decryptData(encryptedApiKey, pin);
          setDecryptedApiKey(decrypted.isOk ? decrypted.value : "");
        } catch (error) {
          console.error("Decryption failed:", error);
          setDecryptedApiKey("");
        }
      }
      setIsUnlocked(true);
    } else {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      // alert("Incorrect PIN");
      setPassCodeError("Incorrect PIN, please try again.");
    }
  };

  const handleClear = () => {
    setEncryptedApiKey("");
    setDecryptedApiKey("");
    setApiKeyInput("");
    setIsUnlocked(false);
    setEnteredPin("");
  };

  return (
    <>
      <PassCode
        isPlayShakeAnimation={isShaking}
        onComplete={handlePinSubmit}
        error={passCodeError}
      />
      <p className="pt-2">
        <ToolTipWrapper
          content="You will need to re-enter your API key again"
          backgroundColorHex="#ff0000"
        >
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
