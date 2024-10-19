import { useCallback, useEffect, useState } from "react";

const useManageLocalStorage = <T>(key: string) => {
  const [data, setData] = useState<T | undefined>();
  const [isLoadingDataForFirstTime, setIsLoadingDataForFirstTime] =
    useState<boolean>(true);

  const clearData = useCallback(() => {
    localStorage.removeItem(key);
    setData(undefined);
  }, [key, setData]);
  const saveData = useCallback(
    (nextData: T) => {
      localStorage.setItem(key, JSON.stringify(nextData));
      setData(nextData);
    },
    [key, setData]
  );

  useEffect(
    function loadInitialForm() {
      try {
        const preSavedData = localStorage.getItem(key);
        if (preSavedData) {
          console.log(`Loaded data from LocalStorage:`, preSavedData);
          setData(JSON.parse(preSavedData));
        }
      } catch (err) {
        console.warn(`Error loading data from LocalStorage:`, err);
        clearData(); // clear corrupt data
      } finally {
        setIsLoadingDataForFirstTime(false);
      }
    },
    [key, clearData]
  );

  return { data, isLoadingDataForFirstTime, clearData, saveData };
};

export default useManageLocalStorage;
