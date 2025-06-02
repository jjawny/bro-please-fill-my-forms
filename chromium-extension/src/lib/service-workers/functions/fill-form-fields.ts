export const fillFormFields = (
  tabId: number,
  formData: Record<string, string>,
  sendResponse: (response: any) => void
) => {
  chrome.scripting.executeScript(
    {
      target: { tabId },
      func: (data) => {
        let filledCount = 0;

        console.log("Form data to fill:", data);
        console.log("Available elements on page:");
        const allInputs = document.querySelectorAll("input, select, textarea");
        allInputs.forEach((el, i) => {
          console.log(`Element ${i}:`, {
            id: el.id,
            name: (el as HTMLInputElement).name,
            dataDigiField: el.getAttribute("data-digi-field"),
            tagName: el.tagName,
            type: (el as HTMLInputElement).type,
          });
        });

        Object.entries(data).forEach(([fieldId, value]) => {
          // First try to find by data-digi-field attribute
          let element = document.querySelector(
            `[data-digi-field="${fieldId}"]`
          ) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

          // If not found, try to find by name attribute
          if (!element) {
            element = document.querySelector(
              `input[name="${fieldId}"], select[name="${fieldId}"], textarea[name="${fieldId}"]`
            ) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
          }

          // If still not found, try to find by id attribute
          if (!element) {
            element = document.querySelector(`#${fieldId}`) as
              | HTMLInputElement
              | HTMLSelectElement
              | HTMLTextAreaElement;
          }

          console.log(
            `Trying to fill field "${fieldId}" with value "${value}"`
          );
          console.log(`Found element:`, element);

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
              const option = Array.from(select.options).find(
                (opt) => opt.value === value || opt.text === value
              );
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

        return { filledCount, totalFields: Object.keys(data).length };
      },
      args: [formData],
    },
    (result) => {
      if (chrome.runtime.lastError) {
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
        });
        return;
      }

      if (result && result[0] && result[0].result) {
        const { filledCount, totalFields } = result[0].result;
        sendResponse({
          success: true,
          message: `Successfully filled ${filledCount} out of ${totalFields} fields`,
        });
      } else {
        sendResponse({ success: false, error: "Failed to fill form fields" });
      }
    }
  );
};
