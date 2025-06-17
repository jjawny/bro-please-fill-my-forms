// Function to scrape form fields from the page

import { ServiceWorkerAction } from "../enums/ServiceWorkerAction";
import {
  FillFormFieldsRequest,
  FillFormFieldsResponse,
  ScrapeFormFieldsRequest,
  ScrapeFormFieldsResponse,
} from "../types/message-types";
import { fillFormFields } from "./functions/fill-form-fields";
import { scrapeFormFields } from "./functions/scrape-form-fields";

const KEEP_CHANNEL_OPEN = true;
const CLOSE_CHANNEL = false;

chrome.runtime.onMessage.addListener(
  (
    message: ScrapeFormFieldsRequest | FillFormFieldsRequest,
    _,
    sendResponse: (response: ScrapeFormFieldsResponse | FillFormFieldsResponse) => void,
  ) => {
    console.debug("SW received:", message);

    if (!message.tabId) {
      sendResponse({ success: false, error: "No tab to act on" });
      return CLOSE_CHANNEL;
    }

    switch (message.action) {
      case ServiceWorkerAction.SCRAPE_FORM_FIELDS:
        scrapeFormFields(message.tabId, sendResponse);
        return KEEP_CHANNEL_OPEN;

      case ServiceWorkerAction.FILL_FORM_FIELDS:
        if (!message.formData) {
          sendResponse({ success: false, error: "Form data is required" });
          return CLOSE_CHANNEL;
        }
        fillFormFields(message.tabId, message.formData, sendResponse);
        return KEEP_CHANNEL_OPEN;

      default:
        sendResponse({
          success: false,
          error: `Unsupported action`,
        });
        return CLOSE_CHANNEL;
    }
  },
);
