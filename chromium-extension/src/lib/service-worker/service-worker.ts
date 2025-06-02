// Function to scrape form fields from the page

import { fillFormFields } from "./functions/fill-form-fields";
import { scrapeFormFields } from "./functions/scrape-form-fields";
import { SERVICE_WORKER_ACTIONS } from "./service-worker-actions";

const KEEP_CHANNEL_OPEN = true;
const CLOSE_CHANNEL = false;

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  console.log("Received message:", message);

  if (!message.tabId) {
    sendResponse({ success: false, error: "No tab to act on" });
    return CLOSE_CHANNEL;
  }

  switch (message.action) {
    case SERVICE_WORKER_ACTIONS.scrapeFormFields:
      scrapeFormFields(message.tabId, sendResponse);
      return KEEP_CHANNEL_OPEN;

    case SERVICE_WORKER_ACTIONS.fillFormFields:
      if (!message.formData) {
        sendResponse({ success: false, error: "Form data is required" });
        return CLOSE_CHANNEL;
      }
      fillFormFields(message.tabId, message.formData, sendResponse);
      return KEEP_CHANNEL_OPEN;

    default:
      sendResponse({
        success: false,
        error: `Action '${message.action}' is unsupported`,
      });
      return CLOSE_CHANNEL;
  }
});
