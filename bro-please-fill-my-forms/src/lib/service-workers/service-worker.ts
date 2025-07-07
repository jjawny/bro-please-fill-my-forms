import { ServiceWorkerAction } from "~/lib/enums/ServiceWorkerAction";
import { err, ErrOr } from "~/lib/models/ErrOr";
import { ScrapedForm } from "~/lib/models/FormField";
import { ServiceWorkerRequest } from "~/lib/models/ServiceWorkerRequest";
import { fillFormFields } from "./functions/fill-form-fields";
import { scrapeFormFields } from "./functions/scrape-form-fields";

const KEEP_CHANNEL_OPEN = true;
const CLOSE_CHANNEL = false;

chrome.runtime.onMessage.addListener(
  (message: ServiceWorkerRequest, _, sendResponse: (response: ErrOr | ErrOr<ScrapedForm>) => void) => {
    if (!message.tabId) {
      sendResponse(err({ uiMessage: "No tab to act on" }));
      return CLOSE_CHANNEL;
    }

    switch (message.action) {
      case ServiceWorkerAction.SCRAPE_FORM_FIELDS:
        scrapeFormFields(message.tabId, sendResponse);
        return KEEP_CHANNEL_OPEN;

      case ServiceWorkerAction.FILL_FORM_FIELDS:
        if (!message.formData) {
          sendResponse(err({ uiMessage: "Form data required" }));
          return CLOSE_CHANNEL;
        }
        fillFormFields(message.tabId, message.formData, sendResponse);
        return KEEP_CHANNEL_OPEN;
      // No default case needed here
    }
  },
);
