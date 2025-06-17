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
1. `npm run dev` to edit the popup UI like a normal web app (faster feedback loop)
2. ❗️ Because running locally (not as an extension) does not grant access to *chrome.storage.**, app will sh!t itself. To combat this, the chrome storage services will check if we're in development mode and mock storage CRUD ops as successful. `npm run dev` = development mode, `npm run build` = production mode
3. During development, use shortcuts `⌃1` and `⌃2`, which will log JSON of the Zustand stores to the browser console

## Viewing console logs
- ⚛️ Component logs? inspect the popup
- 💉 Injected scripts logs? inspect current page
- 🤖 Service worker logs? inspect the extension

  ![how to view extension console logs](readme/inspect-service-worker-logs.png)
