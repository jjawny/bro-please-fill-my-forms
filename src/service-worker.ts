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

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.isOn !== undefined) {
    console.log("sender:", sender);
    console.log("message:", message);

    if (!message.tabId) {
      console.log("no valid tabid to target");
      return;
    }

    loadCustomCssForTab(message.tabId);

    console.log("about to execute script");
    chrome.scripting.executeScript({
      target: { tabId: message.tabId }, // TODO: Ensure the current ntab ID is valid e.g starts with chrome:// or arc:// or does NOT start with http
      func: (isOn) => {
        // Logs here are in the tab's console
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
