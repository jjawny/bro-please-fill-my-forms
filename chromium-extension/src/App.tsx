import { useState } from "react";
import { Theme } from "./lib/enums/Theme";
import { useTheme } from "./lib/hooks/useTheme";
import { SERVICE_WORKER_ACTIONS } from "./lib/service-workers/service-worker-actions";
import { usePinStore } from "./lib/stores/PinStore";
import { ScrapedForm } from "./lib/types/FormField";
import ByoApiKey from "./lib/ui/ByoApiKey";
import { generateFormContent } from "./lib/utils/geminiApi";

function App() {
  const [scrapedForm, setScrapedForm] = useState<ScrapedForm | null>(null);
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // const { theme, toggleTheme } = useTheme();
  const { toggleTheme } = useTheme();
  const { geminiApiKeyDecrypted } = usePinStore();

  const scrapeFormFields = () => {
    setIsLoading(true);
    setErrorMessage("");

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0]?.id) {
        chrome.runtime.sendMessage(
          {
            action: SERVICE_WORKER_ACTIONS.scrapeFormFields,
            tabId: tabs[0].id,
          },
          (response) => {
            setIsLoading(false);
            if (response?.success) {
              setScrapedForm(response.form);
            } else {
              setErrorMessage(response?.error || "Failed to scrape form");
            }
          },
        );
      }
    });
  };

  const fillForm = async () => {
    if (!scrapedForm || !userPrompt.trim() || !geminiApiKeyDecrypted) {
      setErrorMessage("Please scrape form, enter a prompt, and set your Gemini API key");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const formStructure = scrapedForm.fields.map((field) => ({
        name: field.name || field.id,
        type: field.type,
        label: field.label,
        placeholder: field.placeholder,
        options: field.options,
      }));

      const response = await generateFormContent(geminiApiKeyDecrypted, formStructure, userPrompt);

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0 && tabs[0]?.id) {
          chrome.runtime.sendMessage(
            {
              action: SERVICE_WORKER_ACTIONS.fillFormFields,
              tabId: tabs[0].id,
              formData: response.fields,
              scrapedForm: scrapedForm,
            },
            (fillResponse) => {
              setIsLoading(false);
              if (!fillResponse?.success) {
                setErrorMessage(fillResponse?.error || "Failed to fill form");
              }
            },
          );
        }
      });
    } catch (error) {
      setIsLoading(false);
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
    }
  };

  return (
    <div className="container">
      <div className="grid-bg"></div>
      <div className="content">
        <ByoApiKey />
        <div className="card">
          {/* API Key Input */}
          <div style={{ marginBottom: "10px" }}>
            <input
              type="password"
              placeholder="Enter Gemini API Key"
              value={geminiApiKeyDecrypted || ""}
              // onChange={(e) =>
              //   setUserData("geminiApiKeyEncrypted", e.target.value)
              // }
              style={{ width: "100%", padding: "8px", marginBottom: "5px" }}
            />
          </div>

          {/* Form Scraping */}
          <button onClick={scrapeFormFields} disabled={isLoading}>
            {isLoading ? "Scraping..." : "Scrape Form Fields"}
          </button>

          {/* Display scraped form info */}
          {scrapedForm && (
            <div
              style={{
                margin: "10px 0",
                padding: "10px",
                border: "1px solid #ccc",
              }}
            >
              <p>Found {scrapedForm.fields.length} form fields:</p>
              <ul style={{ textAlign: "left", fontSize: "12px" }}>
                {scrapedForm.fields.map((field, index) => (
                  <li key={index}>
                    {field.label || field.name || field.id} ({field.type})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* User Prompt Input */}
          <div style={{ marginBottom: "10px" }}>
            <textarea
              placeholder="Enter your prompt for filling the form (e.g., 'Fill this job application for a software engineer position')"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              style={{ width: "100%", padding: "8px", minHeight: "60px" }}
            />
          </div>

          {/* Fill Form Button */}
          <button
            onClick={fillForm}
            disabled={isLoading || !scrapedForm || !userPrompt.trim() || !geminiApiKeyDecrypted}
          >
            {isLoading ? "Filling Form..." : "Fill Form with AI"}
          </button>

          {/* Error Display */}
          {errorMessage && <div style={{ color: "red", margin: "10px 0", fontSize: "12px" }}>{errorMessage}</div>}

          {/* Theme and debug controls */}
          <div
            style={{
              marginTop: "20px",
              borderTop: "1px solid #ccc",
              paddingTop: "10px",
            }}
          >
            <button onClick={() => toggleTheme(Theme.dark)}>dark</button>
            <button onClick={() => toggleTheme(Theme.light)}>light</button>
            <button onClick={() => toggleTheme(Theme.system)}>system</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
