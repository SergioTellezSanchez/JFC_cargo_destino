'use client';

import { useLanguage } from '@/lib/LanguageContext';

export default function DriverInstructions() {
    const { language } = useLanguage();

    const content = {
        es: {
            title: 'Guía para Conductores',
            steps: [
                'Inicia sesión para ver tus rutas asignadas.',
                'Marca los paquetes como "Recogido" al iniciar la ruta.',
                'Usa el mapa para navegar a la dirección de entrega.',
                'Confirma la entrega al llegar al destino.'
            ]
        },
        en: {
            title: 'Driver Guide',
            steps: [
                'Log in to view your assigned routes.',
                'Mark packages as "Picked Up" when starting the route.',
                'Use the map to navigate to the delivery address.',
                'Confirm delivery upon arrival at the destination.'
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
