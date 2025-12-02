'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import OnboardingGuide from '@/components/OnboardingGuide';
import AdminInstructions from '@/components/AdminInstructions';
import DriverInstructions from '@/components/DriverInstructions';
import { useState } from 'react';

export default function Home() {
    const { language } = useLanguage();
    const t = useTranslation(language);
    const [showAdminGuide, setShowAdminGuide] = useState(false);
    const [showDriverGuide, setShowDriverGuide] = useState(false);

    return (
        <main className="container" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 80px)',
            gap: '3rem',
            padding: '2rem'
        }}>
            <OnboardingGuide />

            <div style={{ textAlign: 'center', maxWidth: '800px' }}>
                <h1 style={{
                    fontSize: '3.5rem',
                    fontWeight: '800',
                    background: 'linear-gradient(to right, var(--primary), var(--accent))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '1rem',
                    lineHeight: 1.2
                }}>
                    {t('appTitle')}
                </h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--secondary)', maxWidth: '600px', margin: '0 auto' }}>
                    {language === 'es' ? 'Gestión logística inteligente para entregas rápidas y eficientes.' : 'Smart logistics management for fast and efficient deliveries.'}
                </p>
            </div>

            <div className="responsive-grid" style={{ width: '100%', maxWidth: '1000px', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                    <Link href="/admin" className="card card-interactive" style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        textAlign: 'center',
                        padding: '3rem 2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        border: '1px solid var(--border)',
                        background: 'var(--card-bg)',
                        height: '100%'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1.5rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}>📊</div>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', fontWeight: '700' }}>{t('adminDashboard')}</h2>
                        <p style={{ color: 'var(--secondary)', lineHeight: 1.6 }}>{t('adminDesc')}</p>
                    </Link>
                    <button
                        onClick={() => setShowAdminGuide(!showAdminGuide)}
                        className="btn"
                        style={{ width: '100%', background: 'transparent', border: '1px solid var(--border)', color: 'var(--secondary)' }}
                    >
                        {showAdminGuide ? (language === 'es' ? 'Ocultar Guía' : 'Hide Guide') : (language === 'es' ? 'Ver Guía de Admin' : 'View Admin Guide')}
                    </button>
                    {showAdminGuide && <AdminInstructions />}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                    <Link href="/driver" className="card card-interactive" style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        textAlign: 'center',
                        padding: '3rem 2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        border: '1px solid var(--border)',
                        background: 'var(--card-bg)',
                        height: '100%'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1.5rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}>🚚</div>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', fontWeight: '700' }}>{t('driverApp')}</h2>
                        <p style={{ color: 'var(--secondary)', lineHeight: 1.6 }}>{t('driverDesc')}</p>
                    </Link>
                    <button
                        onClick={() => setShowDriverGuide(!showDriverGuide)}
                        className="btn"
                        style={{ width: '100%', background: 'transparent', border: '1px solid var(--border)', color: 'var(--secondary)' }}
                    >
                        {showDriverGuide ? (language === 'es' ? 'Ocultar Guía' : 'Hide Guide') : (language === 'es' ? 'Ver Guía de Conductor' : 'View Driver Guide')}
                    </button>
                    {showDriverGuide && <DriverInstructions />}
                </div>
            </div>
        </main>
    );
}
