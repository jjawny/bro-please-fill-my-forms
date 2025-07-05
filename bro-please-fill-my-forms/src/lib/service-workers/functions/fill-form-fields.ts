import { err, ErrOr, ok } from "~/lib/models/ErrOr";
import { PopulatedFormFieldsLlmResponse } from "~/lib/models/llm-structured-responses/PopulateFormFieldLlmResponse";

export const fillFormFields = (
  tabId: number,
  formData: PopulatedFormFieldsLlmResponse,
  sendResponse: (response: ErrOr) => void,
) => {
  chrome.scripting.executeScript(
    {
      target: { tabId },
      args: [formData],
      /**
       * Pro tip: GPT a vanilla JS version of this function then test directly on web page (rapidly feedback loop)
       * Cannot import libs/constants/etc here; must be isolated/lightweight/vanilla
       */
      func: (formData) => {
        /**
         * Finds the element using multiple strats
         */
        const findElement = (fieldId: string) => {
          // Try custom attribute set during scraping
          const INPUT_SELECTOR_NAME = "data-digi-field";
          let element = document.querySelector(`[${INPUT_SELECTOR_NAME}="${fieldId}"]`);
          if (element) return element;

          // Try the ID
          element = document.getElementById(fieldId);
          if (element) return element;

          // Try the name attribute
          element = document.querySelector(
            `input[name="${fieldId}"], select[name="${fieldId}"], textarea[name="${fieldId}"]`,
          );
          if (element) return element;

          // Try the aria-label
          element = document.querySelector(`[aria-label="${fieldId}"]`);
          if (element) return element;

          // Try the contenteditable elements
          element = document.querySelector(`[contenteditable="true"][data-field="${fieldId}"]`);
          return element;
        };

        /**
         * Use after updating elements, triggers re-renders for modern frameworks (React/Vue/Angular/etc)
         */
        const triggerEvents = (element: HTMLElement) => {
          const events = [
            new Event("input", { bubbles: true, cancelable: true }),
            new Event("change", { bubbles: true, cancelable: true }),
            new Event("blur", { bubbles: true, cancelable: true }),
            new KeyboardEvent("keydown", { bubbles: true, cancelable: true }),
            new KeyboardEvent("keyup", { bubbles: true, cancelable: true }),
          ];

          events.forEach((event) => element.dispatchEvent(event));

          // Also trigger React/Vue specific events
          const reactEvent = new Event("input", { bubbles: true });
          Object.defineProperty(reactEvent, "target", { writable: false, value: element });
          element.dispatchEvent(reactEvent);
        };

        /**
         * Sets the new value for different field types
         */
        const setValue = (element: HTMLElement, value: string): boolean => {
          const handleInputElement = (input: HTMLInputElement, value: string, type: string): boolean => {
            switch (type) {
              case "checkbox":
                const isChecked =
                  ["true", "yes", "1", "on", "checked"].includes(value.toLowerCase()) || input.value === value;
                input.checked = isChecked;
                triggerEvents(input);
                return true;

              case "radio":
                // For radio buttons, check if this specific radio should be selected
                if (input.value === value || input.id === value) {
                  input.checked = true;
                  triggerEvents(input);
                  return true;
                }

                // Also try to find and check the correct radio in the group
                const radioGroup = document.querySelectorAll(`input[name="${input.name}"][type="radio"]`);

                for (const radio of radioGroup) {
                  const radioElement = radio as HTMLInputElement;

                  if (radioElement.value === value) {
                    radioElement.checked = true;
                    triggerEvents(radioElement);
                    return true;
                  }
                }

                return false;

              case "file":
                // Can't programmatically set file inputs for security reasons
                console.warn("Cannot programmatically fill file inputs");
                return false;

              case "date":
              case "datetime-local":
              case "time":
                // Ensure date/time values are in correct format
                input.value = value;
                triggerEvents(input);
                return true;

              default:
                // Handle text, email, password, number, url, tel, etc.
                input.value = value;
                triggerEvents(input);
                return true;
            }
          };

          const handleSelectElement = (select: HTMLSelectElement, value: string): boolean => {
            // Try exact value match first
            for (const option of select.options) {
              if (option.value === value) {
                select.value = option.value;
                triggerEvents(select);
                return true;
              }
            }

            // Try text content match
            for (const option of select.options) {
              if (option.textContent?.trim().toLowerCase() === value.toLowerCase()) {
                select.value = option.value;
                triggerEvents(select);
                return true;
              }
            }

            // Try partial match
            for (const option of select.options) {
              if (
                option.textContent?.toLowerCase().includes(value.toLowerCase()) ||
                option.value.toLowerCase().includes(value.toLowerCase())
              ) {
                select.value = option.value;
                triggerEvents(select);
                return true;
              }
            }

            return false;
          };

          const handleTextAreaElement = (textarea: HTMLTextAreaElement, value: string): boolean => {
            textarea.value = value;
            triggerEvents(textarea);
            return true;
          };

          const tagName = element.tagName.toLowerCase();
          const inputType = (element as HTMLInputElement).type?.toLowerCase();

          try {
            switch (tagName) {
              case "input":
                return handleInputElement(element as HTMLInputElement, value, inputType);
              case "select":
                return handleSelectElement(element as HTMLSelectElement, value);
              case "textarea":
                return handleTextAreaElement(element as HTMLTextAreaElement, value);
              default:
                // Handle contenteditable or other elements
                if (element.hasAttribute("contenteditable")) {
                  element.textContent = value;
                  triggerEvents(element);
                  return true;
                }
                return false;
            }
          } catch (error) {
            console.warn("Error setting value:", error);
            return false;
          }
        };

        let filledCount = 0;

        formData.fields.forEach((field) => {
          const { id, value } = field;

          if (!value && value !== "0") return; // Skip empty values (but allow '0')

          const element = findElement(id);

          if (element && setValue(element as HTMLElement, String(value))) {
            filledCount++;
          }
        });

        return { filledCount, totalFields: formData.fields.length };
      },
    },
    (response) => {
      if (chrome.runtime.lastError) {
        sendResponse(err({ uiMessage: `Chrome error: ${chrome.runtime.lastError.message}` }));

        return;
      }

      if (response[0].result) {
        const { filledCount, totalFields } = response[0].result;
        sendResponse(ok({ uiMessage: `Successfully filled ${filledCount}/${totalFields} fields` }));

        return;
      }

      sendResponse(err({ uiMessage: "Failed to fill form fields" }));
    },
  );
};
