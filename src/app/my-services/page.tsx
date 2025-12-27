'use client';

import { History } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageContext';
import PackageManagement from '@/components/management/PackageManagement';

export default function MyServicesPage() {
    const { language } = useLanguage();
    const t = useTranslation(language);

    return (
        <main className="container" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <History size={32} /> {t('myServices')}
                    </h1>
                    <p style={{ color: 'var(--secondary)' }}>Consulta el historial y estado de tus envíos.</p>
                </div>
            </div>

            <PackageManagement isAdminView={false} />
        </main>
    );
}
