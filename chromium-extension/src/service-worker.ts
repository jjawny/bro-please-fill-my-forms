let isCustomCssReady = false;

const loadCustomCssForTab = (tabId: number) => {
  if (isCustomCssReady) return; // already laoded

  console.log("oading custom css for tab", tabId);
  chrome.scripting.insertCSS({
    target: { tabId: tabId },
    files: ["injected.css"],
  });
  isCustomCssReady = true; // Set this to true after injecting
};

// Function to scrape form fields from the page
const scrapeFormFields = (
  tabId: number,
  sendResponse: (response: any) => void
) => {
  chrome.scripting.executeScript(
    {
      target: { tabId },
      func: () => {
        const formFields: any[] = [];

        // Find all input, select, and textarea elements
        const inputs = document.querySelectorAll("input, select, textarea");

        inputs.forEach((element, index) => {
          const input = element as
            | HTMLInputElement
            | HTMLSelectElement
            | HTMLTextAreaElement;

          // Skip hidden, submit, button inputs
          if (
            input.type === "hidden" ||
            input.type === "submit" ||
            input.type === "button"
          ) {
            return;
          }

          const field: any = {
            id: input.id || `field_${index}`,
            name: input.name || input.id || `field_${index}`,
            type: input.type || "text",
            placeholder: (input as HTMLInputElement).placeholder || "",
            required: input.required || false,
            value: input.value || "",
            selector: `[data-digi-field="${
              input.id || input.name || `field_${index}`
            }"]`,
          };

          // Add data attribute for targeting later
          input.setAttribute("data-digi-field", field.id);

          // Find associated label
          let label = "";
          if (input.id) {
            const labelElement = document.querySelector(
              `label[for="${input.id}"]`
            );
            if (labelElement) {
              label = labelElement.textContent?.trim() || "";
            }
          }

          // If no label found, look for parent label or nearby text
          if (!label) {
            const parentLabel = input.closest("label");
            if (parentLabel) {
              label =
                parentLabel.textContent?.replace(input.value, "").trim() || "";
            }
          }

          field.label = label;

          // Handle select options
          if (input.tagName === "SELECT") {
            const select = input as HTMLSelectElement;
            field.options = Array.from(select.options).map(
              (option) => option.value || option.text
            );
          }

          // Handle radio/checkbox options
          if (input.type === "radio" || input.type === "checkbox") {
            const name = input.name;
            if (name) {
              const relatedInputs = document.querySelectorAll(
                `input[name="${name}"]`
              );
              field.options = Array.from(relatedInputs).map(
                (inp: any) => inp.value
              );
            }
          }

          formFields.push(field);
        });

        return {
          fields: formFields,
          formAction: document.querySelector("form")?.action || "",
          formMethod: document.querySelector("form")?.method || "POST",
        };
      },
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
        sendResponse({ success: true, form: result[0].result });
      } else {
        sendResponse({ success: false, error: "No form fields found" });
      }
    }
  );
};

// Function to fill form fields
const fillFormFields = (
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);

  if (message.action === "toggleIsometric") {
    if (!message.tabId) {
      console.log("no valid tabid to target");
      return;
    }

    loadCustomCssForTab(message.tabId);

    chrome.scripting.executeScript({
      target: { tabId: message.tabId },
      func: (isOn) => {
        console.log("Toggling isometric mode:", isOn);
        if (isOn) {
          document.body.classList.add("digi-worlds-isometric-mode");
        } else {
          document.body.classList.remove("digi-worlds-isometric-mode");
        }
      },
      args: [message.isOn],
    });
  } else if (message.action === "scrapeForm") {
    if (!message.tabId) {
      sendResponse({ success: false, error: "No valid tab ID provided" });
      return;
    }
    scrapeFormFields(message.tabId, sendResponse);
    return true; // Keep message channel open for async response
  } else if (message.action === "fillForm") {
    if (!message.tabId || !message.formData) {
      sendResponse({ success: false, error: "Missing tab ID or form data" });
      return;
    }
    fillFormFields(message.tabId, message.formData, sendResponse);
    return true; // Keep message channel open for async response
  }

  // Legacy support for old message format
  if (message.isOn !== undefined) {
    console.log("sender:", sender);
    console.log("message:", message);

    if (!message.tabId) {
      console.log("no valid tabid to target");
      return;
    }

    loadCustomCssForTab(message.tabId);

    chrome.scripting.executeScript({
      target: { tabId: message.tabId },
      func: (isOn) => {
        console.log("ison?", isOn);
        if (isOn) {
          console.log("adding styles");
          document.body.classList.add("digi-worlds-isometric-mode");
        } else {
          document.body.classList.remove("digi-worlds-isometric-mode");
        }
      },
      args: [message.isOn],
    });
  }
});
