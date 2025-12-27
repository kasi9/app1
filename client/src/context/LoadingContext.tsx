import { createContext } from "react";

export type LoadingContextType = {
  showLoading: () => void;
  hideLoading: () => void;
};

export const LoadingContext = createContext<LoadingContextType | null>(null);
