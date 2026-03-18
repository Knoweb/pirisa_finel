import React, { useState, createContext, useContext, ReactNode } from 'react';

// Define the shape of the context
interface LanguageContextType {
    language: string;
    setLanguage: (language: string) => void;
    translations: Record<string, string>;
    setTranslations: (translations: Record<string, string>) => void;
}

// Create the context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Language provider component
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const storedLanguage = localStorage.getItem("language") || "en";
    const [language, setLanguage] = useState(storedLanguage);
    const [translations, setTranslations] = useState<Record<string, string>>({});

    const updateLanguage = (newLanguage: string) => {
        setLanguage(newLanguage);
        localStorage.setItem("language", newLanguage);
    };

    return (
        <LanguageContext.Provider value={{ 
            language, 
            setLanguage: updateLanguage, 
            translations, 
            setTranslations 
        }}>
            {children}
        </LanguageContext.Provider>
    );
};

// Custom hook to use the language context
// eslint-disable-next-line react-refresh/only-export-components
export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useTranslation must be used within a LanguageProvider");
    }
    return context;
};
