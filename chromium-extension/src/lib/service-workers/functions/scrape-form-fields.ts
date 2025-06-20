import { FormField, ScrapedForm } from "~/lib/models/FormField";
import { ScrapeFormFieldsResponse } from "~/lib/models/ServiceWorkerMessages";

export const scrapeFormFields = (tabId: number, sendResponse: (response: ScrapeFormFieldsResponse) => void) => {
  chrome.scripting.executeScript(
    {
      target: { tabId },
      /**
       * PRO TIP: GPT a vanilla JS version of the fn to exec directly on the web page (rapidly feedback loop)
       * Cannot import libs/constants/etc here; must be isolated/lightweight/vanilla
       */
      func: () => {
        /**
         * Find the associated label for an element
         */
        const findLabel = (el: HTMLElement): string => {
          // Try label[for] first
          if (el.id) {
            const labelElement = document.querySelector(`label[for="${el.id}"]`);

            if (labelElement) {
              return labelElement.textContent?.trim() || "";
            }
          }

          // Try parent label
          const parentLabel = el.closest("label");

          if (parentLabel) {
            const labelText = parentLabel.textContent?.trim() || "";

            // Remove the input's value from the label text
            return labelText.replace(el.getAttribute("value") || "", "").trim();
          }

          // Try preceding label or text node
          let prev = el.previousElementSibling;

          while (prev) {
            if (prev.tagName === "LABEL") {
              return prev.textContent?.trim() || "";
            }

            if (prev.textContent?.trim()) {
              return prev.textContent.trim();
            }

            prev = prev.previousElementSibling;
          }

          // Try aria-label or placeholder as fallback
          return el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.getAttribute("title") || "";
        };

        /**
         * Get the field type
         */
        const getFieldType = (el: HTMLElement): string => {
          if (el.tagName === "SELECT") return "select";
          if (el.tagName === "TEXTAREA") return "textarea";
          return (el as HTMLInputElement).type || "text";
        };

        // 1. Scrape all editable elements
        const formElements = document.querySelectorAll("input, select, textarea, [contenteditable='true']");
        const formFields: FormField[] = [];

        formElements.forEach((el, idx) => {
          const input = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
          const type = getFieldType(input);

          // 2. Skip non-interactive elements
          const skipTypes = ["hidden", "submit", "button", "reset", "image"];
          if (skipTypes.includes(type)) {
            return;
          }

          // 3. Build the DTO
          const fieldId = input.id || input.name || `field_${idx}`;
          const field: FormField = {
            id: fieldId,
            name: input.name || fieldId,
            type: type,
            placeholder: input.getAttribute("placeholder") || "",
            required: input.hasAttribute("required"),
            value: input.value || input.textContent || "",
            label: findLabel(input),
          };

          // 4. Set a selector to find this element later
          const INPUT_SELECTOR_NAME = "data-digi-field";
          el.setAttribute(INPUT_SELECTOR_NAME, fieldId);

          // 5. Handle select options
          if (type === "select") {
            const select = input as HTMLSelectElement;
            field.options = Array.from(select.options).map((option) => option.value || option.text);
          }

          // 6. Handle radio/checkbox options groups
          if (type === "radio" || type === "checkbox") {
            const groupName = input.name;

            if (groupName) {
              const relatedInputs = document.querySelectorAll(`input[name="${groupName}"]`);
              field.options = Array.from(relatedInputs).map((inp) => (inp as HTMLInputElement).value);
            }
          }

          formFields.push(field);
        });

        const finalForm: ScrapedForm = { fields: formFields };

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
