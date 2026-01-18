import { createContext, useContext } from "react";
import { type AppContextType } from '../types/AppContext.type'

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx)
    throw new Error("useAppContext must be used inside AppContextProvider");
  return ctx;
};