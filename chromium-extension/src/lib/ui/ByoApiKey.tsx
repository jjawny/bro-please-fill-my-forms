import { useState } from "react";
import { decryptData, encryptData } from "../utils/crypto";
import PassCode from "./PassCode";

const PIN = "123456";

export default function ByoApiKey() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [encryptedApiKey, setEncryptedApiKey] = useState<string>("");
  const [decryptedApiKey, setDecryptedApiKey] = useState<string>("");
  const [enteredPin, setEnteredPin] = useState<string>("");
  const [apiKeyInput, setApiKeyInput] = useState<string>("");

  const handlePinSubmit = async (pin: string) => {
    if (pin === PIN) {
      setEnteredPin(pin);
      if (encryptedApiKey) {
        // Decrypt existing key
        try {
          const decrypted = await decryptData(encryptedApiKey, pin);
          setDecryptedApiKey(decrypted);
        } catch (error) {
          console.error("Decryption failed:", error);
          setDecryptedApiKey("");
        }
      }
      setIsUnlocked(true);
    } else {
      alert("Incorrect PIN");
    }
  };

  const handleApiKeySubmit = async () => {
    if (apiKeyInput && enteredPin) {
      try {
        // Encrypt the API key
        const encrypted = await encryptData(apiKeyInput, enteredPin);
        setEncryptedApiKey(encrypted);
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
        <p>
          To protect your BYO Gemini API Key, enter your PIN to{" "}
          {encryptedApiKey ? "decrypt" : "unlock"}
        </p>
        <p>
          Forgot your key?{" "}
          <button
            onClick={handleClear}
            style={{
              background: "none",
              border: "none",
              color: "blue",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Click here to clear
          </button>{" "}
          (you will need to re-enter an API key again)
        </p>
        <PassCode onComplete={handlePinSubmit} />
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
        <input
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
