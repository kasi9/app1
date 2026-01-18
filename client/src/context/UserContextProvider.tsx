
import { jwtDecode } from "jwt-decode";
import React, { useState, useEffect, useMemo } from "react";

import { UserContext } from "./UserContext";
import { api } from "./api";
import { useAppContext } from "./AppContext";

interface User { id: string, name: string, email: string };

export const UserContextProvider: React.FC<{children: React.ReactNode }> = ({children}) => {
    const { baseURL } = useAppContext();
    const [token, setToken] = useState<string|null>(null);
    const [userName, setUserName] = useState<string>("");
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [actions, setActions] = useState<string[]>([]);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("username");

        setToken(storedToken);
        setUserName(storedUser??"");
        setIsLoggedIn(!!storedToken);
    }, []);


    const updateUserName = (name: string) => {
        localStorage.setItem('username',name);
        setUserName(name);
    }

    const updateLoggedIn = (logged: boolean) => {
        setToken(localStorage.getItem("token"));
        setUserName(localStorage.getItem("username")??"");
        setIsLoggedIn(logged);
    }

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");

        setToken(null);
        setUserName("");
        setIsLoggedIn(false);
        setActions([]);
    }

    const getActions = async (formCode: string | null) => {
//        if (!token || !formCode) return;

        try {
//            const decoded = jwtDecode<User>(token);
            const res = await api.post( `${baseURL}/users/privilegesByUserForm`,{ formCode: formCode }, { headers: { Authorization: `Bearer ${token}` } } );
            
            setActions(res?.data?.actions ?? []);

        } catch (err) {
            console.error("Failed to load actions", err);
        }
    };

    const value = useMemo ( 
        () => ({ token, userName, setUserName: updateUserName, isLoggedIn, setIsLoggedIn: updateLoggedIn, logout, actions, getActions, setActions, }), 
        [token, userName, isLoggedIn, actions] 
    );

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}



