'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
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

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
