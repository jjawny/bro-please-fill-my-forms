import PassCode from "./PassCode";

export default function ByoApiKey() {
  const handleClear = () => {};
  const handleSubmit = (apiKey: string) => {};
  return (
    <>
      <p>To protect your BYO Gemini API Key, enter your PIN to decrypt</p>
      <p>
        Forgot your key? Click here to clear (you will need to re-enter an API
        key again)
      </p>
      <PassCode />
      <div style={{ marginBottom: "10px" }}>
        <input
          type="password"
          placeholder="Enter Gemini API Key"
          onChange={(e) => handleSubmit(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "5px" }}
        />
      </div>
    </>
  );
}
