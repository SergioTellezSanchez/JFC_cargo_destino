'use client';

import { useRouter } from 'next/navigation';
import { Truck } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageContext';
import VehicleManagement from '@/components/management/VehicleManagement';

export default function VehiclesPage() {
    const { language } = useLanguage();
    const t = useTranslation(language);
    const router = useRouter();

    return (
        <main className="container" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Truck size={32} style={{ color: 'var(--primary)' }} />
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                        {t('fleetTitle')}
                    </h1>
                    <p style={{ color: 'var(--secondary)' }}>Gestión de unidades en tiempo real.</p>
                </div>
            </div>

            <VehicleManagement isAdminView={false} />
        </main>
    );
}
