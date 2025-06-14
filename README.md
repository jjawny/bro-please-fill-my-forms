# NEED A BETTER NAME

A Chromium **Extension** that **auto-fills** forms based on **natural** language (pro-tip: use **dictation**! 🎙️)

# Use
1. BYO keys; generate your Google Gemini API Key [here](https://aistudio.google.com/apikey) (free quota)
2. Find a site with forms
3. Open the popup and follow the steps to auto-fill


# Run
1. `npm run build` will dump a [dist](./dist) directory (see [vite.config.ts](./vite.config.ts))
2. Open your Chromium browser extension page (for example: [chrome://extensions/](chrome://extensions/))
3. Click <kbd>Load unpacked</kbd> and choose [dist](./dist)
4. Make changes and repeat `npm run build` + reload <img src="readme/reload-extension-guide.png" alt="reload extension" style="max-height: 256px;">

## Edit popup UI fast
1. `cp .env.example .env` and set **VITE_MOCK_CHROME_STORAGE_OPS_SUCCESSFUL** to **true** to avoid errors galore, these errors are expected when not running as a Chrome Extension as no access to *chrome.storage.x* ∴ will sh!t itself
2. `npm run dev` to edit the popup UI like a normal web app (faster feedback loop)

## Viewing console logs
- ⚛️ Component logs? inspect the popup
- 💉 Injected scripts logs? inspect current page
- 🤖 Service worker logs? inspect the extension

  ![how to view extension console logs](readme/inspect-service-worker-logs.png)
