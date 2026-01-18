import { createContext, useContext } from "react";

export type LoadingContextType = {
    showLoading: () => void;
    hideLoading: () => void;
};

export const LoadingContext = createContext<LoadingContextType | null>(null);

export const useLoadingContext = () => {
    const ctx = useContext(LoadingContext);
    if (!ctx) throw new Error("useLoadingContext must be used inside LoadingProvider");
    return ctx;
};
