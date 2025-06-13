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
5. `npm run dev` to edit the popup UI like a normal web app (faster feedback loop), ignore console errors from **chrome-storage-sync.ts** and **chrome-storage-session.ts** (expected as not running as a Chrome extension ∴ no access to these storages ∴ will sh!t itself)

To view console logs:

- ⚛️ Component logs? inspect the popup
- 💉 Injected scripts logs? inspect current page
- 🤖 Service worker logs? inspect the extension

  ![how to view extension console logs](readme/inspect-service-worker-logs.png)


---
TODO:

- [ ] delete components.json when done as its pretty broken
- [ ] console warn anything that isn't caught? need to separate logs for things that aren't us (dont console.error our errors, use console.warn?)
- [ ] update all schemas and stores and default storage types to validate and infer tpye as nullable NOT nullish (think about how this fails validation when the value does not exist yet) as setting pin as undefined does not clear it but null does, OR we can change any undefined values to null during saving as thats the intent anyway (to clear)