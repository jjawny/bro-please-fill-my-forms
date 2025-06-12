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
4. From here, the feedback loop is `npm run build` + reload <img src="readme/reload-extension-guide.png" alt="reload extension" style="max-height: 256px;">
5. `npm run dev` to edit the popup UI like a normal web app (note any event handlers using the _chrome_ obj will sh!t itself)

To view console logs:

- ⚛️ Component logs? inspect the popup
- 💉 Injected scripts logs? inspect current page
- 🤖 Service worker logs? inspect the extension

  ![how to view extension console logs](readme/inspect-service-worker-logs.png)


---
TODO:

- [ ] Migrate logic from App.tsx out (ApiKeyField and ByoApiKey fields to be deleted)
- [ ] then delete App.tsx
- [ ] then rename App2.tsx to App.tsx
- [ ] start the theme
- [ ] figure out the best way to control the size of chrome extension UIs
- [ ] delete components.json when done as its pretty broken
- [ ] console warn anything that isn't caught? need to separate logs for things that aren't us (dont console.error our errors, use console.warn?)