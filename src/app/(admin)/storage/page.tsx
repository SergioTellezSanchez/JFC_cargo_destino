'use client';

import { useRouter } from 'next/navigation';
import { Warehouse } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageContext';
import WarehouseManagement from '@/components/management/WarehouseManagement';

export default function StoragePage() {
    const { language } = useLanguage();
    const t = useTranslation(language);
    const router = useRouter();

    return (
        <main className="container" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Warehouse size={32} style={{ color: 'var(--primary)' }} />
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                        {t('warehousesTitle')}
                    </h1>
                    <p style={{ color: 'var(--secondary)' }}>Gestión de instalaciones y almacenamiento.</p>
                </div>
            </div>

            <WarehouseManagement isAdminView={false} />
        </main>
    );
}
