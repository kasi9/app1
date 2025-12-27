
import React, { createContext} from "react";
import type { ReactNode } from "react";

interface FileType { id: string, name: string, extension: string, mime: string}

interface AppContextType { pageSize: number; baseURL: string; isValidataionEnabled: boolean; fileTypes: FileType[]}
interface AppContextProviderProps { children: ReactNode; }

export const AppContent = createContext<AppContextType | null>(null)!;

export const AppContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {

    const value: AppContextType = { 
        pageSize: import.meta.env.VITE_PAGE_SIZE,
        isValidataionEnabled: import.meta.env.VITE_ENABLE_FRONTEND_VALIDATION === 'true',
        baseURL: import.meta.env.VITE_BASE_URL,
        fileTypes: [
            {id: "audio", name: "Audio", extension: "mp3", mime: "audio/mpeg"},
            {id: "video", name: "Video", extension: "mp4", mime: "video/mp4"},
            {id: "image", name: "Image", extension: "jpeg", mime: "image/jpeg"},
            {id: "image", name: "Image", extension: "png", mime: "image/png"},
            {id: "pdf", name: "PDF", extension: "pdf", mime: "application/pdf"},
            {id: "youTube", name: "YouTube", extension: "", mime: "youTube"},
            {id: "gmap", name: "Google Map", extension: "", mime: "gmap"},
            {id: "webLink", name: "webLink", extension: "", mime: "webLink"},
        ]
    };

    return (
        <AppContent.Provider value={value}> {children} </AppContent.Provider>
    );
};

