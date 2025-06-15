import { useState } from "react";
import { ScrapedForm } from "~/lib/models/FormField";
import { SERVICE_WORKER_ACTIONS } from "~/lib/service-workers/service-worker-actions";
import { RippleButton } from "./shadcn/ripple";

export default function Step2() {
  const [scrapedForm, setScrapedForm] = useState<ScrapedForm | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [, setErrorMessage] = useState<string>("");

  // const useNewApiKey = usePinStore((state) => state.useNewApiKey);

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

  return (
    <div>
      <h2 className="text-start">2. Find Form Fields on Current Page</h2>
      <RippleButton disabled={isLoading} onClick={scrapeFormFields} className="w-full h-7">
        Find Fields (merge with step 3)
      </RippleButton>

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
    </div>
  );
}
