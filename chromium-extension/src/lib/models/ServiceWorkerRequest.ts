import { ServiceWorkerAction } from "~/lib/enums/ServiceWorkerAction";
import { PopulatedFormFieldsLlmResponse } from "./llm-structured-responses/PopulateFormFieldLlmResponse";

export type ServiceWorkerRequest =
  | { tabId: number; action: typeof ServiceWorkerAction.SCRAPE_FORM_FIELDS }
  | { tabId: number; action: typeof ServiceWorkerAction.FILL_FORM_FIELDS; formData: PopulatedFormFieldsLlmResponse };
