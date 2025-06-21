export const ServiceWorkerAction = {
  SCRAPE_FORM_FIELDS: "scrape_form_fields",
  FILL_FORM_FIELDS: "fill_form_fields",
} as const;

export type ServiceWorkerActionType = (typeof ServiceWorkerAction)[keyof typeof ServiceWorkerAction];
