'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function WorldClock() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (offset: number) => {
        const d = new Date(time.getTime() + offset * 3600 * 1000);
        return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' });
    };

    // Mexico Time Zones (Approximate offsets from UTC for demo purposes, or use toLocaleString with timeZone)
    // CDMX is UTC-6 (CST), Tijuana is UTC-8 (PST), Cancun is UTC-5 (EST)
    // Note: Javascript dates are local. Best to use toLocaleString with timeZone option.

    const getTimeInZone = (zone: string) => {
        return time.toLocaleTimeString('es-MX', { timeZone: zone, hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="card" style={{ padding: '1rem', display: 'flex', gap: '2rem', justifyContent: 'center', alignItems: 'center', marginBottom: '2rem', background: 'var(--primary)', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} className="text-accent" style={{ color: 'var(--accent)' }} />
                <span style={{ fontWeight: 'bold' }}>Zonas Horarias:</span>
            </div>
            <div style={{ display: 'flex', gap: '2rem' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Tijuana</div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{getTimeInZone('America/Tijuana')}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>CDMX</div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{getTimeInZone('America/Mexico_City')}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Cancún</div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{getTimeInZone('America/Cancun')}</div>
                </div>
            </div>
        </div>
    );
}
