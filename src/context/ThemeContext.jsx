// ═══════════════════════════════════════════════════
// THEME CONTEXT — Dark / Light Mode
// ═══════════════════════════════════════════════════

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        try {
            const savedTheme = localStorage.getItem("nexus-theme");
            return savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
        } catch {
            return "dark";
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem("nexus-theme", theme);
        } catch {
            // Ignore storage failures and continue with in-memory theme.
        }
    }, [theme]);

    const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
    return (
        <ThemeContext.Provider value={{ theme, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
