import { ScrapedForm } from "~/lib/models/FormField";
import { ServiceWorkerActionType } from "../service-workers/service-worker-actions";

// Base message interface
export interface BaseMessage {
  action: ServiceWorkerActionType;
  tabId: number;
}

// Specific message types
export type ScrapeFormFieldsRequest = BaseMessage & {
  action: "ScrapeFormFields";
};

export type FillFormFieldsRequest = BaseMessage & {
  action: "FillFormFields";
  formData: Record<string, string>;
  scrapedForm: ScrapedForm;
};

// Union type for all possible messages

// Base response interface
export interface BaseResponse {
  success: boolean;
  error?: string;
}

// Specific response types
export interface ScrapeFormFieldsResponse extends BaseResponse {
  form?: ScrapedForm;
}

export interface FillFormFieldsResponse extends BaseResponse {
  // No additional data needed for fill response
}

// Type-safe sendMessage function type
export type SendMessageFunction = {
  (message: ScrapeFormFieldsRequest): Promise<ScrapeFormFieldsResponse>;
  (message: FillFormFieldsRequest): Promise<FillFormFieldsResponse>;
};
