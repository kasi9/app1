import { useContext } from "react";
import { LoadingContext } from "./LoadingContext";

export const useLoadingContext = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error("useLoadingContext must be used inside LoadingProvider");
  return ctx;
};
