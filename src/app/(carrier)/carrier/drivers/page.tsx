'use client';

import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageContext';
import DriverManagement from '@/components/management/DriverManagement';

export default function DriversPage() {
    const { language } = useLanguage();
    const t = useTranslation(language);
    const router = useRouter();

    return (
        <main className="container" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Users size={32} style={{ color: 'var(--primary)' }} />
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                        {t('driversTitle')}
                    </h1>
                    <p style={{ color: 'var(--secondary)' }}>Gestión de operadores y permisos.</p>
                </div>
            </div>

            <DriverManagement isAdminView={false} />
        </main>
    );
}
