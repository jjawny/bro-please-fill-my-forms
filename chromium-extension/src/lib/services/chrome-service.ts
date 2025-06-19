import { ServiceWorkerAction } from "~/lib/enums/ServiceWorkerAction";
import { err, ErrOr, ok } from "~/lib/models/ErrOr";
import { ScrapedForm } from "~/lib/models/FormField";
import type {
  FillFormFieldsRequest,
  FillFormFieldsResponse,
  ScrapeFormFieldsRequest,
  ScrapeFormFieldsResponse,
} from "~/lib/models/ServiceWorkerMessages";
import { logError } from "~/lib/utils/log-utils";
import { PopulatedFormFieldsLlmResponse } from "../models/llm-structured-responses/PopulateFormFieldLlmResponse";

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

export async function scrapeFormFields(tabId: number): Promise<ErrOr<ScrapedForm>> {
  let messages = ["Begin scraping form fields"];

  try {
    const message: ScrapeFormFieldsRequest = { tabId, action: ServiceWorkerAction.SCRAPE_FORM_FIELDS };
    const scrapeFormFieldsResponse: ScrapeFormFieldsResponse = await chrome.runtime.sendMessage(message);

    if (!scrapeFormFieldsResponse.isOk) {
      return err({ messages, uiMessage: scrapeFormFieldsResponse.error || "Service worker failed" });
    }

    if (!scrapeFormFieldsResponse.form) {
      return err({ messages, uiMessage: "No form found" });
    }

    return ok({ messages, uiMessage: "Successfully scraped form fields", value: scrapeFormFieldsResponse.form });
  } catch (error: unknown) {
    return err({ messages, uiMessage: logError(error, "Failed to scrape form fields") });
  }
}

export async function fillFormFields(tabId: number, formData: PopulatedFormFieldsLlmResponse): Promise<ErrOr> {
  let messages = ["Begin filling form fields"];

  try {
    const message: FillFormFieldsRequest = {
      action: ServiceWorkerAction.FILL_FORM_FIELDS,
      tabId: tabId,
      formData: formData,
    };

    const fillFormFieldsResponse: FillFormFieldsResponse = await chrome.runtime.sendMessage(message);

    if (!fillFormFieldsResponse.isOk) {
      return err({ messages, uiMessage: fillFormFieldsResponse.error || "Service worker failed" });
    }

    return ok({ messages, uiMessage: "Successfully filled form fields" });
  } catch (error: unknown) {
    return err({ messages, uiMessage: logError(error, "Failed to fill form fields") });
  }
}
