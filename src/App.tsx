import { useState } from "react";
import "./App.css";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";

function App() {
  const [isIsometrictMode, setIsIsometricMode] = useState<boolean>(false);

  const toggleIsometricMode = () => {
    console.log("test");

    setIsIsometricMode((curr) => {
      const next = !curr;
      // refreshInjectedCssForCurrentTab(next);
      // chrome.runtime.sendMessage({ isOn: next });
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        // This will only have one tab, the active tab in the current window
        if (tabs.length > 0 && tabs[0]?.id) {
          // tabs[0] is the active tab
          chrome.runtime.sendMessage({ isOn: next, tabId: tabs[0].id }); // TODO: fix, the first tab might be invalid (chrome/ etc) extract into a validat tab URL fn
        } else {
          console.log("No active tab found");
        }
      });
      return next;
    });
  };

  // const refreshCss = (isOn: boolean) => {
  //   if (isOn) {
  //     document.body.classList.add("isometric-mode");
  //   } else {
  //     document.body.classList.remove("isometric-mode");
  //   }
  // };

  // // const refreshInjectedCssForCurrentTab = (isOn: boolean) => {
  // //   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  // //     console.log("here"); // TODO: remove
  // //     if (tabs[0]?.id) {
  // //       console.log("Active Tab URL:", tabs[0].url); // TODO: remove
  // //       chrome.scripting.executeScript({
  // //         target: { tabId: tabs[0].id },
  // //         func: refreshCss,
  // //         args: [isOn],
  // //       });
  // //     }
  // //   });
  // // };

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={toggleIsometricMode}>
          {isIsometrictMode ? "on" : "off"}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
