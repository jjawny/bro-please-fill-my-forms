import { ServiceWorkerAction } from "~/lib/enums/ServiceWorkerAction";
import { err, ErrOr, Messages, ok } from "~/lib/models/ErrOr";
import { ScrapedForm } from "~/lib/models/FormField";
import { PopulatedFormFieldsLlmResponse } from "~/lib/models/llm-structured-responses/PopulateFormFieldLlmResponse";
import { ServiceWorkerRequest } from "~/lib/models/ServiceWorkerRequest";
import { logError } from "~/lib/utils/log-utils";

export async function getActiveTab(): Promise<ErrOr<chrome.tabs.Tab>> {
  const messages: Messages = ["Begin getting active tab"];

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
  const messages: Messages = ["Begin scraping form fields"];

  try {
    const message: ServiceWorkerRequest = { tabId, action: ServiceWorkerAction.SCRAPE_FORM_FIELDS };
    const scrapeFormFieldsResponse: ErrOr<ScrapedForm> = await chrome.runtime.sendMessage(message);

    if (!scrapeFormFieldsResponse.isOk) {
      return err({ messages, uiMessage: scrapeFormFieldsResponse.uiMessage, isAddUiMessageToMessages: false });
    }

    return ok({ messages, uiMessage: "Successfully scraped form fields", value: scrapeFormFieldsResponse.value });
  } catch (error: unknown) {
    return err({ messages, uiMessage: logError(error, "Failed to scrape form fields") });
  }
}

export async function fillFormFields(tabId: number, formData: PopulatedFormFieldsLlmResponse): Promise<ErrOr> {
  const messages: Messages = ["Begin filling form fields"];

  try {
    const message: ServiceWorkerRequest = {
      action: ServiceWorkerAction.FILL_FORM_FIELDS,
      tabId: tabId,
      formData: formData,
    };

    const fillFormFieldsResponse: ErrOr = await chrome.runtime.sendMessage(message);

    if (!fillFormFieldsResponse.isOk) {
      return err({ messages, uiMessage: fillFormFieldsResponse.uiMessage, isAddUiMessageToMessages: false });
    }

    return ok({ messages, uiMessage: "Successfully filled form fields" });
  } catch (error: unknown) {
    return err({ messages, uiMessage: logError(error, "Failed to fill form fields") });
  }
}
