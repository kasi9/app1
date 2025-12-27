import axios from "axios";
import { useCallback, useContext } from "react";
import { AppContent } from "./AppContext";

export type AuditDetails = Record<string, unknown> | string | number | null;

export const logUserAction = async (baseURL: string, action: string, details?: AuditDetails) => {
  
    try {
        await axios.post( `${ baseURL }/audit`, { action, details, timestamp: new Date().toISOString(), }, { withCredentials: true } );
    } catch (err) {
        console.error("Audit log failed:", err);
    }

};

export const useAudit = () => {

    const { baseURL } = useContext(AppContent)!; 
    
    const trackAction = useCallback((action: string, details?: AuditDetails) => {
        logUserAction(baseURL, action, details);
    }, [baseURL]);

    return { trackAction };
};
