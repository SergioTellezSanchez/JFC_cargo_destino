'use client';

import { useLanguage } from '@/lib/LanguageContext';

export default function AdminInstructions() {
    const { language } = useLanguage();

    const content = {
        es: {
            title: 'Guía de Administración',
            steps: [
                'Usa el panel para ver todas las entregas pendientes.',
                'Asigna conductores a los paquetes específicos.',
                'Monitorea el estado de las entregas en tiempo real.',
                'Gestiona la flota de conductores desde la sección "Conductores".'
            ]
        },
        en: {
            title: 'Admin Guide',
            steps: [
                'Use the dashboard to view all pending deliveries.',
                'Assign drivers to specific packages.',
                'Monitor delivery status in real-time.',
                'Manage the driver fleet from the "Drivers" section.'
            ]
        }
    };

    const t = language === 'es' ? content.es : content.en;

    return (
        <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>{t.title}</h3>
            <ul style={{ paddingLeft: '1.5rem', listStyleType: 'disc', color: 'var(--secondary)' }}>
                {t.steps.map((step, index) => (
                    <li key={index} style={{ marginBottom: '0.5rem' }}>{step}</li>
                ))}
            </ul>
        </div>
    );
}
