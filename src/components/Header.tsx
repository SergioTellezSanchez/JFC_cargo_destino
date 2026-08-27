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
    const { logout, user } = useUser();
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

                {user && (
                    <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginRight: '0.5rem', borderRight: '1px solid var(--border)', paddingRight: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--foreground)' }}>
                                {user.name?.split(' ')[0] || 'Usuario'}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', textTransform: 'capitalize' }}>
                                {user.role?.toLowerCase() || 'Cliente'}
                            </span>
                        </div>
                        {user.photoURL ? (
                            <img 
                                src={user.photoURL} 
                                alt="User Avatar" 
                                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} 
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                        )}
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem', borderRadius: '0.6rem', border: '1px solid var(--border)', background: 'var(--card-bg)' }}>
                    <Globe size={18} color="var(--primary)" />
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as any)}
                        style={{
                            border: 'none',
                            background: 'transparent',
                            fontWeight: 'bold',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            outline: 'none',
                            padding: '0.1rem 0.3rem'
                        }}
                    >
                        <option value="es">ES</option>
                        <option value="en">EN</option>
                        <option value="zh">ZH</option>
                        <option value="de">DE</option>
                        <option value="fr">FR</option>
                    </select>
                </div>

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
