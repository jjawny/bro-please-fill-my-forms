import { PopulatedFormFieldsLlmResponse } from "~/lib/models/llm-structured-responses/PopulateFormFieldLlmResponse";
import { FillFormFieldsResponse } from "~/lib/models/ServiceWorkerMessages";

export const fillFormFields = (
  tabId: number,
  formData: PopulatedFormFieldsLlmResponse,
  sendResponse: (response: FillFormFieldsResponse) => void,
) => {
  chrome.scripting.executeScript(
    {
      target: { tabId },
      args: [formData],
      /**
       * PRO TIP: GPT a vanilla JS version of the fn to exec directly on the web page (rapidly feedback loop)
       * Try not to import libs here; keep lightweight/vanilla
       */
      func: (formData) => {
        let filledCount = 0;

        formData.fields.forEach((field) => {
          const { id: fieldId, value } = field;

          // First try to find by data-digi-field attribute
          let element = document.querySelector(`[data-digi-field="${fieldId}"]`) as
            | HTMLInputElement
            | HTMLSelectElement
            | HTMLTextAreaElement;

          // If not found, try to find by name attribute
          if (!element) {
            element = document.querySelector(
              `input[name="${fieldId}"], select[name="${fieldId}"], textarea[name="${fieldId}"]`,
            ) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
          }

          // If still not found, try to find by id attribute
          if (!element) {
            element = document.querySelector(`#${fieldId}`) as
              | HTMLInputElement
              | HTMLSelectElement
              | HTMLTextAreaElement;
          }

          if (element && value) {
            if (element.type === "checkbox" || element.type === "radio") {
              // For checkbox/radio, check if the value matches
              if (element.value === value) {
                (element as HTMLInputElement).checked = true;
                filledCount++;
              }
            } else if (element.tagName === "SELECT") {
              // For select, set the value
              const select = element as HTMLSelectElement;
              const option = Array.from(select.options).find((opt) => opt.value === value || opt.text === value);

              if (option) {
                select.value = option.value;
                filledCount++;
              }
            } else {
              // For regular inputs and textareas
              element.value = value;

              // Trigger input event to ensure React/Vue components update
              element.dispatchEvent(new Event("input", { bubbles: true }));
              element.dispatchEvent(new Event("change", { bubbles: true }));
              filledCount++;
            }
          }
        });

        return { filledCount, totalFields: formData.fields.length };
      },
    },
    (response) => {
      if (chrome.runtime.lastError) {
        sendResponse({ isOk: false, uiMessage: chrome.runtime.lastError.message });
        return;
      }

      if (response[0].result) {
        const { filledCount, totalFields } = response[0].result;
        sendResponse({ isOk: true, uiMessage: `Successfully filled ${filledCount}/${totalFields} fields` });
        return;
      }

      sendResponse({ isOk: false, uiMessage: "Failed to fill form fields" });
    },
  );
};
