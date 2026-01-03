'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { useUser } from '@/lib/UserContext';
import { ArrowLeft, LogOut, Globe } from 'lucide-react';

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const { language, setLanguage } = useLanguage();
    const { logout } = useUser();
    const t = useTranslation(language);

    const isHome = pathname === '/';

    return (
        <header style={{
            background: 'var(--card-bg)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border)',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            boxShadow: 'var(--shadow-sm)',
            height: '70px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {!isHome && (
                    <button
                        onClick={() => router.push('/')}
                        className="btn-icon"
                        style={{
                            padding: '0.5rem',
                            background: 'var(--secondary-bg)',
                            color: 'var(--foreground)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        aria-label="Go back"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}
                <img
                    src="/jfc_carg-_destino_logo.png"
                    alt="JFC Cargo Destino"
                    className="logo"
                />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>

                <button
                    className="btn-ghost"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        cursor: 'pointer'
                    }}
                    onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                >
                    <Globe size={18} />
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{language.toUpperCase()}</span>
                </button>

                <button
                    className="btn btn-secondary"
                    style={{
                        padding: '0.5rem',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                    onClick={async () => {
                        await logout();
                        window.location.href = '/';
                    }}
                    title="Cerrar Sesión"
                >
                    <LogOut size={18} />
                    <span className="hide-mobile">Salir</span>
                </button>
            </div>
            <style jsx>{`
                .logo {
                    height: 60px;
                    width: auto;
                    object-fit: contain;
                    transition: height 0.3s ease;
                }
                @media (max-width: 768px) {
                    .logo {
                        height: 40px;
                    }
                    .hide-mobile {
                        display: none;
                    }
                }
                .btn-icon:hover {
                    background: var(--border) !important;
                }
            `}</style>
        </header>
    );
}
