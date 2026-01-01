import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'default' | 'saffron' | 'green' | 'teal';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        return (localStorage.getItem('app-theme') as Theme) || 'default';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    // Sync with user selection
    const changeTheme = (newTheme: Theme) => {
        setTheme(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme: changeTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
