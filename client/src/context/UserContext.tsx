import axios from "axios";
import { jwtDecode } from "jwt-decode";
import React, { createContext, useContext, useState, useEffect } from "react";
import { AppContent } from "./AppContext";

interface UserContextType { 
    token: string | null;   
    userName: string | null; 
    setUserName: (userName: string) => void;
    isLoggedIn: boolean | null;
    setIsLoggedIn: (logged: boolean) => void;
    logout: () => void;
    actions: string[]; 
    setActions?: (actions: string[]) => void;
    getActions: (formCode: string | null) => Promise<void>;
}

interface User { id: string, name: string, email: string };

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{children: React.ReactNode }> = ({children}) => {
    const { baseURL } = useContext(AppContent)!;
    
    const [token, setToken] = useState<string|null>(null);
    const [userName, setUserName] = useState<string|null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean|null>(null);
    const [actions, setActions] = useState<string[]>([]);

    useEffect(() => {
      setToken(localStorage.getItem("token"));
      const token = localStorage.getItem("token");
      setIsLoggedIn(token ? true: false); 

      setUserName(localStorage.getItem('username'));
    }, [userName]);

    const updateUserName = (name: string) => {
        localStorage.setItem('username',name);
        setUserName(name);
    }

    const updateLoggedIn = (logged: boolean) => {
        setIsLoggedIn(logged);
    }

    const updateLogout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      setActions([]);
    }

    const getActions = async (formCode: string | null) => {
        setToken(localStorage.getItem("token"));
        const token = localStorage.getItem('token');
        if (token) {
            const decoded: User = jwtDecode<User>(token);

            await axios.get(`${baseURL}/users/privilegesByUserForm/${decoded.id}/${formCode}`, { headers: { Authorization: `Bearer ${token}` } } )
            .then((response) => { 
                setActions([...actions,response.data.actions]);            
                response.data.actions.map((a:string) => actions.push(a));
            });
        }
    }

    return (
        <UserContext.Provider value={{ userName, setUserName: updateUserName, isLoggedIn, setIsLoggedIn: updateLoggedIn, logout: updateLogout
          , actions, setActions, getActions, token}}> {children} 
        </UserContext.Provider>
    )
}

export const useUser = () => {

    const context = useContext(UserContext);
    
    if (!context) {
        throw new Error("useUserContext must be used within a UserProvider");
    }

    return context;
};

