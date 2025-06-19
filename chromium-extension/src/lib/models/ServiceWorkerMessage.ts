import { ServiceWorkerActionType } from "~/lib/enums/ServiceWorkerAction";
import { ScrapedForm } from "~/lib/models/FormField";
import { PopulatedFormFieldsLlmResponse } from "./llm-structured-responses/PopulateFormFieldLlmResponse";

type BaseMessageRequest = {
  tabId: number;
  action: ServiceWorkerActionType;
};

type BaseMessageResponse = {
  isOk: boolean;
  error?: string;
};

export type ScrapeFormFieldsRequest = BaseMessageRequest & {
  action: "scrape_form_fields";
};

export type FillFormFieldsRequest = BaseMessageRequest & {
  action: "fill_form_fields";
  formData: PopulatedFormFieldsLlmResponse;
};

export type ScrapeFormFieldsResponse = BaseMessageResponse & {
  form?: ScrapedForm;
};

export type FillFormFieldsResponse = BaseMessageResponse;
