
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const { language, setLanguage } = useLanguage();
    const t = useTranslation(language);

    const isHome = pathname === '/';

    return (
        <header style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border)',
            padding: '1rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            boxShadow: 'var(--shadow-sm)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {!isHome && (
                    <button
                        onClick={() => router.push('/')}
                        className="btn"
                        style={{
                            padding: '0.5rem',
                            background: 'transparent',
                            color: 'var(--foreground)',
                            fontSize: '1.2rem',
                            border: '1px solid var(--border)'
                        }}
                        aria-label="Go back"
                    >
                        ←
                    </button>
                )}
                <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--foreground)', letterSpacing: '-0.025em' }}>
                    Logistics<span style={{ color: 'var(--primary)' }}>App</span>
                </h1>
            </div>

            <button
                className="btn"
                style={{
                    background: 'white',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                    fontSize: '0.9rem',
                    padding: '0.5rem 1rem'
                }}
                onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
            >
                {language === 'es' ? '🇬🇧 EN' : '🇪🇸 ES'}
            </button>
        </header>
    );
}
