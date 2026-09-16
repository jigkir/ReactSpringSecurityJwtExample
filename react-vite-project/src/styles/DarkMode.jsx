import {createContext, useContext, useEffect, useState} from 'react';

const DarkMode = createContext(null);

export function useDarkMode() {
    const ctx = useContext(DarkMode);
    if (!ctx) throw new Error('useDarkMode must be used within DarkModeProvider');
    return ctx;
}

export function DarkModeProvider({children}) {
    const [dark, setDark] = useState(() => {
        const stored = localStorage.getItem('darkMode');
        if (stored !== null) return stored === 'true';
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
    });

    useEffect(() => {
        localStorage.setItem('darkMode', dark);
    }, [dark]);

    const toggleDark = () => setDark(prev => !prev);

    return (
        <DarkMode.Provider value={{dark, toggleDark}}>
            {children}
        </DarkMode.Provider>
    );
}