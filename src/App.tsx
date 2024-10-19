import { useEffect, useState } from "react";
import "./App.css";
import reactLogo from "./assets/react.svg";
import useManageLocalStorage from "./lib/hooks/useManageLocalStorage";
import {
  defaultUserPreferences,
  LOCAL_STORAGE_KEY,
  UserPreferencesType,
} from "./lib/types/UserPreferences";
import viteLogo from "/vite.svg";

function App() {
  const [isIsometrictMode, setIsIsometricMode] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const {
    data: userPreferences,
    // isLoadingDataForFirstTime,
    // clearData,
    saveData,
  } = useManageLocalStorage<UserPreferencesType>(LOCAL_STORAGE_KEY);

  useEffect(() => {
    if (userPreferences?.theme === "dark") {
      setIsDarkMode(true);
      document.body.classList.add("dark");
    }
    // ignore? run once
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((curr) => {
      const isDarkMode = !curr;
      document.body.classList.toggle("dark", isDarkMode);
      // TODO: handle system
      saveData(
        userPreferences
          ? { ...userPreferences, theme: isDarkMode ? "dark" : "light" }
          : defaultUserPreferences
      );
      return isDarkMode;
    });
  };

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
        <button onClick={toggleTheme}>{isDarkMode ? "on" : "off"}</button>
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
