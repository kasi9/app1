import { useEffect, useState, type ReactNode } from "react";
import { LoadingContext } from "./LoadingContext";
import { registerAxiosLoader } from "./api";

export const LoadingContextProvider = ({ children }: { children: ReactNode }) => {
    const [isLoading, setIsLoading] = useState(false);

    const showLoading = () => setIsLoading(true);
    const hideLoading = () => setIsLoading(false);

    useEffect(() => {
        registerAxiosLoader(showLoading, hideLoading);
    }, []);
  
    return (
        <LoadingContext.Provider value={{ showLoading, hideLoading }}> {children} 
            {isLoading && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
                    fontSize: 22, zIndex: 9999, pointerEvents: "auto", }} > Loading…
                </div>
            )}
        </LoadingContext.Provider>
    );
};
