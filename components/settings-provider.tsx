import { createContext, ReactNode, useContext, useState } from "react";

const Context = createContext(
  {} as {
    updateDisableClearLogo: (value: boolean) => void;
    disableClearLogo: boolean;
  },
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [disableClearLogo, setDisableClearLogo] = useState(
    localStorage.getItem("settings.disableClearLogo") === "true",
  );

  const updateDisableClearLogo = (value: boolean) => {
    setDisableClearLogo(value);
    localStorage.setItem("settings.disableClearLogo", value.toString());
  };

  return (
    <Context.Provider value={{ updateDisableClearLogo, disableClearLogo }}>
      {children}
    </Context.Provider>
  );
}

export function useSettings() {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
