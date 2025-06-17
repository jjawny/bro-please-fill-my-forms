import { err, ErrOr, ok } from "~/lib/models/ErrOr";
import { ScrapedForm } from "~/lib/models/FormField";
import { SERVICE_WORKER_ACTIONS } from "~/lib/service-workers/service-worker-actions";
import { logError } from "~/lib/utils/log-utils";

export async function getActiveTab(): Promise<ErrOr<chrome.tabs.Tab>> {
  let messages = ["Begin getting active tab"];

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tabs[0]) {
      return err({ messages, uiMessage: "No active tab found" });
    }

    return ok({ messages, uiMessage: "Successfully found active tab", value: tabs[0] });
  } catch (error: unknown) {
    return err({ messages, uiMessage: logError(error, "Failed to get active tab") });
  }
}

// TODO: fix up and make type-safe response from sendMessage
export async function scrapeFormFields(tabId: number): Promise<ErrOr<ScrapedForm>> {
  let messages = ["Begin scraping form fields"];

  try {
    const response = await chrome.runtime.sendMessage({
      action: SERVICE_WORKER_ACTIONS.scrapeFormFields,
      tabId: tabId,
    });

    if (!response?.success) {
      return err({
        messages,
        uiMessage: response?.error || "Failed to scrape form fields",
      });
    }

    return ok({
      messages,
      uiMessage: "Successfully scraped form fields",
      value: response.form,
    });
  } catch (error: unknown) {
    return err({ messages, uiMessage: logError(error, "Failed to scrape form fields") });
  }
}

export async function fillFormFields(
  tabId: number,
  formData: Record<string, string>,
  scrapedForm: ScrapedForm,
): Promise<ErrOr<boolean>> {
  let messages = ["Begin filling form fields"];

  try {
    const response = await chrome.runtime.sendMessage({
      action: SERVICE_WORKER_ACTIONS.fillFormFields,
      tabId: tabId,
      formData: formData,
      scrapedForm: scrapedForm,
    });

    if (!response?.success) {
      return err({
        messages,
        uiMessage: response?.error || "Failed to fill form fields",
      });
    }

    return ok({
      messages,
      uiMessage: "Successfully filled form fields",
      value: true,
    });
  } catch (error: unknown) {
    return err({ messages, uiMessage: logError(error, "Failed to fill form fields") });
  }
}
