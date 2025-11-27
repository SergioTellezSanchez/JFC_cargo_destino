'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';

export default function Home() {
    const { language, setLanguage } = useLanguage();
    const t = useTranslation(language);

    return (
        <main className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '2rem' }}>


            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t('appTitle')}
            </h1>

            <div style={{
                display: 'flex',
                gap: '2rem',
                flexWrap: 'wrap',
                justifyContent: 'center',
                width: '100%',
                maxWidth: '900px'
            }}>
                <Link href="/admin" className="card card-interactive" style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    flex: '1 1 300px',
                    maxWidth: '400px',
                    textAlign: 'center',
                    padding: '3rem 2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>{t('adminDashboard')}</h2>
                    <p style={{ color: 'var(--secondary)' }}>{t('adminDesc')}</p>
                </Link>

                <Link href="/driver" className="card card-interactive" style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    flex: '1 1 300px',
                    maxWidth: '400px',
                    textAlign: 'center',
                    padding: '3rem 2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚚</div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>{t('driverApp')}</h2>
                    <p style={{ color: 'var(--secondary)' }}>{t('driverDesc')}</p>
                </Link>
            </div>
        </main>
    );
}
