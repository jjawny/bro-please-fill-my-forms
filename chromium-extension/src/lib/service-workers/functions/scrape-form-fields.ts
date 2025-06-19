import { FormField, ScrapedForm } from "~/lib/models/FormField";
import { ScrapeFormFieldsResponse } from "~/lib/models/ServiceWorkerMessages";

export const scrapeFormFields = (tabId: number, sendResponse: (response: ScrapeFormFieldsResponse) => void) => {
  chrome.scripting.executeScript(
    {
      target: { tabId },
      /**
       * PRO TIP: Copy n execute this fn directly on the web page to rapidly test (need to define any params first)
       * Try not to import libs here; keep lightweight/vanilla
       */
      func: () => {
        const formFields: FormField[] = [];

        // Find all input, select, and textarea elements
        const inputs = document.querySelectorAll("input, select, textarea");

        inputs.forEach((element, index) => {
          const input = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

          // Skip hidden, submit, button inputs
          if (input.type === "hidden" || input.type === "submit" || input.type === "button") {
            return;
          }

          const field: any = {
            id: input.id || `field_${index}`,
            name: input.name || input.id || `field_${index}`,
            type: input.type || "text",
            placeholder: (input as HTMLInputElement).placeholder || "",
            required: input.required || false,
            value: input.value || "",
            selector: `[data-digi-field="${input.id || input.name || `field_${index}`}"]`,
          };

          // Add data attribute for targeting later
          input.setAttribute("data-digi-field", field.id);

          // Find associated label
          let label = "";
          if (input.id) {
            const labelElement = document.querySelector(`label[for="${input.id}"]`);
            if (labelElement) {
              label = labelElement.textContent?.trim() || "";
            }
          }

          // If no label found, look for parent label or nearby text
          if (!label) {
            const parentLabel = input.closest("label");
            if (parentLabel) {
              label = parentLabel.textContent?.replace(input.value, "").trim() || "";
            }
          }

          field.label = label;

          // Handle select options
          if (input.tagName === "SELECT") {
            const select = input as HTMLSelectElement;
            field.options = Array.from(select.options).map((option) => option.value || option.text);
          }

          // Handle radio/checkbox options
          if (input.type === "radio" || input.type === "checkbox") {
            const name = input.name;
            if (name) {
              const relatedInputs = document.querySelectorAll(`input[name="${name}"]`);
              field.options = Array.from(relatedInputs).map((inp: any) => inp.value);
            }
          }

          formFields.push(field);
        });

        const finalForm: ScrapedForm = {
          fields: formFields,
        };

        return { finalForm };
      },
    },
    (response) => {
      if (chrome.runtime.lastError) {
        sendResponse({ isOk: false, uiMessage: chrome.runtime.lastError.message });
        return;
      }

      if (response[0].result) {
        const { finalForm } = response[0].result;
        sendResponse({
          isOk: true,
          uiMessage: `Successfully scraped ${finalForm.fields.length} fields`,
          form: finalForm,
        });
        return;
      }

      sendResponse({ isOk: false, uiMessage: "No form fields found" });
    },
  );
};
