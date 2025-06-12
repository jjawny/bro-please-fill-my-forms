import { useState } from "react";
import { encryptData } from "../utils/crypto";
import { Button } from "./shadcn/button";
import { Input } from "./shadcn/input";
import ToolTipWrapper from "./ToolTipWrapper";

export default function ByoApiKey() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [, setEncryptedApiKey] = useState<string>("");
  const [decryptedApiKey, setDecryptedApiKey] = useState<string>("");
  const [enteredPin, setEnteredPin] = useState<string>("");
  const [apiKeyInput, setApiKeyInput] = useState<string>("");

  const handleApiKeySubmit = async () => {
    if (apiKeyInput && enteredPin) {
      try {
        // Encrypt the API key
        const encrypted = await encryptData(apiKeyInput, enteredPin);
        if (!encrypted.isOk) return;
        setEncryptedApiKey(encrypted.value);
        setDecryptedApiKey(apiKeyInput);
        setApiKeyInput("");
      } catch (error) {
        console.error("Encryption failed:", error);
      }
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setDecryptedApiKey("");
    setEnteredPin("");
  };

  const handleClear = () => {
    setEncryptedApiKey("");
    setDecryptedApiKey("");
    setApiKeyInput("");
    setIsUnlocked(false);
    setEnteredPin("");
  };

  if (!isUnlocked) {
    return (
      <>
        <ol className="justify-items-start py-5">
          <li>1. Visit Google Gemini for your free API Key</li>
          <li>2. Choose a PIN you will remember (will not be saved)</li>
          <li>3. Enter your PIN to decrypt your API key before using</li>
        </ol>
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

  return (
    <>
      <div style={{ marginBottom: "10px" }}>
        <button
          onClick={handleLock}
          style={{
            padding: "8px 16px",
            marginBottom: "10px",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          🔒 Lock API Key
        </button>
      </div>

      {decryptedApiKey ? (
        <div style={{ marginBottom: "10px" }}>
          <label>Current API Key:</label>
          <input
            type="text"
            value={decryptedApiKey}
            readOnly
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "5px",
              backgroundColor: "#f5f5f5",
            }}
          />
        </div>
      ) : null}

      <div style={{ marginBottom: "10px" }}>
        <Input
          className="bg-white"
          // type="password"
          placeholder="Enter Gemini API Key"
          value={apiKeyInput}
          onChange={(e) => setApiKeyInput(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "5px" }}
        />
        <button
          onClick={handleApiKeySubmit}
          disabled={!apiKeyInput}
          style={{
            padding: "8px 16px",
            backgroundColor: apiKeyInput ? "#4CAF50" : "#cccccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: apiKeyInput ? "pointer" : "not-allowed",
          }}
        >
          Save & Encrypt API Key
        </button>
      </div>
    </>
  );
}
