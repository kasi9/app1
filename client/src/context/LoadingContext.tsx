import { createContext, useState, type ReactNode } from "react";
import GlobalLoader from "./GlobalLoader";

export type LoadingContextType = {
  isLoading: boolean;
  showLoading: () => void;
  hideLoading: () => void;
};

export const LoadingContext = createContext<LoadingContextType | null>(null);

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);

  const showLoading = () => setIsLoading(true);
  const hideLoading = () => setIsLoading(false);

  return (
    <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
      {children}
      {isLoading && <GlobalLoader />}
    </LoadingContext.Provider>
  );
};
