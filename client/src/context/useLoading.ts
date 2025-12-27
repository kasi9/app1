import { useContext } from "react";
import { LoadingContext } from "./LoadingContext";

export const useLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error("useLoading must be used inside LoadingProvider");
  return ctx;
};
