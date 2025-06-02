import { useState } from "react";
import { Theme } from "./lib/enums/Theme";
import { useTheme } from "./lib/hooks/useTheme";
import { useUserPreferencesStore } from "./lib/stores/UserPreferencesStore";
import { ScrapedForm } from "./lib/types/FormField";
import { generateFormContent } from "./lib/utils/geminiApi";
import viteLogo from "/images/logo.png";

function App() {
  const [isIsometrictMode, setIsIsometricMode] = useState<boolean>(false);
  const [scrapedForm, setScrapedForm] = useState<ScrapedForm | null>(null);
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // const { theme, toggleTheme } = useTheme();
  const { toggleTheme } = useTheme();
  const { userPreferences, setUserPreferences } = useUserPreferencesStore();

  const toggleIsometricMode = () => {
    console.log("Scraping form fields from current page...");

    setIsIsometricMode((curr) => {
      const next = !curr;
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0 && tabs[0]?.id) {
          chrome.runtime.sendMessage({
            action: "toggleIsometric",
            isOn: next,
            tabId: tabs[0].id,
          });
        } else {
          console.log("No active tab found");
        }
      });
      return next;
    });
  };

  const scrapeFormFields = () => {
    setIsLoading(true);
    setErrorMessage("");

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0]?.id) {
        chrome.runtime.sendMessage(
          {
            action: "scrapeForm",
            tabId: tabs[0].id,
          },
          (response) => {
            setIsLoading(false);
            if (response?.success) {
              setScrapedForm(response.form);
            } else {
              setErrorMessage(response?.error || "Failed to scrape form");
            }
          }
        );
      }
    });
  };

  const fillForm = async () => {
    if (!scrapedForm || !userPrompt.trim() || !userPreferences.geminiApiKey) {
      setErrorMessage(
        "Please scrape form, enter a prompt, and set your Gemini API key"
      );
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

      const response = await generateFormContent(
        userPreferences.geminiApiKey,
        formStructure,
        userPrompt
      );

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0 && tabs[0]?.id) {
          chrome.runtime.sendMessage(
            {
              action: "fillForm",
              tabId: tabs[0].id,
              formData: response.fields,
              scrapedForm: scrapedForm,
            },
            (fillResponse) => {
              setIsLoading(false);
              if (!fillResponse?.success) {
                setErrorMessage(fillResponse?.error || "Failed to fill form");
              }
            }
          );
        }
      });
    } catch (error) {
      setIsLoading(false);
      setErrorMessage(
        error instanceof Error ? error.message : "An error occurred"
      );
    }
  };

  return (
    <div className="container">
      <div className="grid-bg"></div>
      <div className="content">
        <div style={{ position: "relative" }}>
          <h1>NEW NAME HERE</h1>
          <div style={{ position: "absolute", top: -30, left: -50 }}>
            <a href="https://vitejs.dev" target="_blank">
              <img
                src={viteLogo}
                style={{ maxHeight: "6rem" }}
                alt="Vite logo"
              />
            </a>
          </div>
        </div>

        {/* GH link */}
        {/* <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
      </div> */}

        <div className="card">
          {/* API Key Input */}
          <div style={{ marginBottom: "10px" }}>
            <input
              type="password"
              placeholder="Enter Gemini API Key"
              value={userPreferences.geminiApiKey || ""}
              onChange={(e) =>
                setUserPreferences("geminiApiKey", e.target.value)
              }
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
            disabled={
              isLoading ||
              !scrapedForm ||
              !userPrompt.trim() ||
              !userPreferences.geminiApiKey
            }
          >
            {isLoading ? "Filling Form..." : "Fill Form with AI"}
          </button>

          {/* Error Display */}
          {errorMessage && (
            <div style={{ color: "red", margin: "10px 0", fontSize: "12px" }}>
              {errorMessage}
            </div>
          )}

          {/* Theme and debug controls */}
          <div
            style={{
              marginTop: "20px",
              borderTop: "1px solid #ccc",
              paddingTop: "10px",
            }}
          >
            <button onClick={toggleIsometricMode}>
              Isometric: {isIsometrictMode ? "on" : "off"}
            </button>
            <button onClick={() => toggleTheme(Theme.Dark)}>dark</button>
            <button onClick={() => toggleTheme(Theme.Light)}>light</button>
            <button onClick={() => toggleTheme(Theme.System)}>system</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
