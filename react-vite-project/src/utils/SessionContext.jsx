// src/utils/SessionContext.jsx
import { createContext, useState } from "react";

export const SessionContext = createContext(null);

export function SessionProvider({ children }) {
    const [selectedSession, setSelectedSession] = useState("");

    return (
        <SessionContext.Provider value={{ selectedSession, setSelectedSession }}>
            {children}
        </SessionContext.Provider>
    );
}