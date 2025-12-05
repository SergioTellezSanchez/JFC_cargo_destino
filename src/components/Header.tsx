
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
            background: 'var(--card-bg)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border)',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            boxShadow: 'var(--shadow-sm)',
            flexWrap: 'wrap',
            gap: '0.5rem'
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
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '40px',
                            width: '40px'
                        }}
                        aria-label="Go back"
                    >
                        ←
                    </button>
                )}
                <img
                    src="/jfc_carg-_destino_logo.png"
                    alt="JFC Cargo Destino"
                    style={{ height: '40px', width: 'auto' }}
                />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

                <button
                    className="btn"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border)',
                        color: 'var(--foreground)',
                        fontSize: '0.9rem',
                        padding: '0.5rem 1rem'
                    }}
                    onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                >
                    {language === 'es' ? '🇬🇧 EN' : '🇪🇸 ES'}
                </button>
            </div>
        </header>
    );
}
