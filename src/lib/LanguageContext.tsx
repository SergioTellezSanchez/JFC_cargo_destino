'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from './i18n';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
    language: 'es',
    setLanguage: () => { },
});

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('es');

    useEffect(() => {
        const stored = localStorage.getItem('jfc_lang') as Language;
        if (stored) setLanguage(stored);
    }, []);

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('jfc_lang', lang);
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
