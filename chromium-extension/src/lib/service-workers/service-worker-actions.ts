export const SERVICE_WORKER_ACTIONS = {
  scrapeFormFields: "ScrapeFormFields",
  fillFormFields: "FillFormFields",
} as const;

export type ServiceWorkerActionType = (typeof SERVICE_WORKER_ACTIONS)[keyof typeof SERVICE_WORKER_ACTIONS];
