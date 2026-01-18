
import type { ReactNode } from "react";
import { type AppContextType } from '../types/AppContext.type';
import { AppContext } from "./AppContext";

interface AppContextProviderProps { children: ReactNode } 

export const AppContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {

    const value: AppContextType = { 

        pageSize: Number(import.meta.env.VITE_PAGE_SIZE ?? 10),
        baseURL: import.meta.env.VITE_BASE_URL ?? "http://localhost:5000",
    };

    return (
        <AppContext.Provider value={value}> {children} </AppContext.Provider>
    );
};

