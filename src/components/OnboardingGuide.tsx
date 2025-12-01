'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

export default function OnboardingGuide() {
    const [isVisible, setIsVisible] = useState(false);
    const { language } = useLanguage();

    useEffect(() => {
        const hasSeenGuide = localStorage.getItem('hasSeenOnboarding');
        if (!hasSeenGuide) {
            setIsVisible(true);
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem('hasSeenOnboarding', 'true');
    };

    if (!isVisible) return null;

    const content = {
        es: {
            title: '¡Bienvenido a LogisticsApp!',
            description: 'Selecciona "Panel de Administración" para gestionar paquetes o "App de Conductor" para ver tu ruta.',
            button: 'Entendido'
        },
        en: {
            title: 'Welcome to LogisticsApp!',
            description: 'Select "Admin Dashboard" to manage packages or "Driver App" to view your route.',
            button: 'Got it'
        }
    };

    const t = content[language as keyof typeof content] || content.es;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
        }}>
            <div className="card" style={{
                maxWidth: '400px',
                width: '100%',
                textAlign: 'center',
                animation: 'fadeIn 0.3s ease-out'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👋</div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>{t.title}</h2>
                <p style={{ color: 'var(--secondary)', marginBottom: '2rem', lineHeight: '1.5' }}>
                    {t.description}
                </p>
                <button
                    onClick={handleClose}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                >
                    {t.button}
                </button>
            </div>
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
