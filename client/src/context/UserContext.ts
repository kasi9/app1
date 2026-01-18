import { createContext, useContext } from "react";

interface UserContextType { 
    token: string | null;   
    userName: string; 
    setUserName: (userName: string) => void;
    isLoggedIn: boolean;
    setIsLoggedIn: (logged: boolean) => void;
    logout: () => void;
    actions: string[]; 
    setActions?: (actions: string[]) => void;
    getActions: (formCode: string | null) => Promise<void>;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUserContext = () => {

    const context = useContext(UserContext);
    
    if (!context) {
        throw new Error("useUserContext must be used within a UserProvider");
    }

    return context;
};