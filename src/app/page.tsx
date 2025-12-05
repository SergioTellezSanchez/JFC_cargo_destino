'use client';

import { useRouter } from 'next/navigation';
import { Truck, Package, Users, Warehouse, Settings, FileText, ShieldCheck, LogIn, LogOut } from 'lucide-react';
import { useUser } from '@/lib/UserContext';
import { useEffect, useState } from 'react';

export default function Dashboard() {
    const router = useRouter();
    const { user, login, logout, isAdmin } = useUser();
    const [emailInput, setEmailInput] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (emailInput) {
            login(emailInput);
            setEmailInput('');
        }
    };

    if (!user) {
        return (
            <main className="container" style={{ minHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 className="text-gradient" style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '1rem' }}>
                        JFC Cargo Destino
                    </h1>
                    <p style={{ fontSize: '1.5rem', color: 'var(--secondary)' }}>
                        Plataforma Integral de Logística y Transporte
                    </p>
                </div>

                <div className="card" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem' }}>
                    <h3 style={{ marginBottom: '2rem', fontWeight: 'bold', fontSize: '1.5rem', textAlign: 'center' }}>Iniciar Sesión</h3>
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Correo Electrónico</label>
                            <input
                                type="email"
                                placeholder="ej. usuario@jfc.com"
                                className="input"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
                            <LogIn size={20} /> Acceder a la Plataforma
                        </button>
                    </form>
                    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', fontSize: '0.9rem', color: 'var(--secondary)' }}>
                        <p style={{ marginBottom: '0.5rem' }}><strong>Credenciales Demo:</strong></p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Admin:</span>
                            <code style={{ background: 'var(--secondary-bg)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>sergiotellezsanchez@gmail.com</code>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Usuario:</span>
                            <code style={{ background: 'var(--secondary-bg)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>Cualquier otro correo</code>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="container" style={{ minHeight: '90vh', padding: '2rem' }}>
            {/* Header & Welcome */}
            <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: '800' }}>
                        Panel de Control
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--secondary)' }}>
                        Bienvenido, {user.name}
                    </p>
                </div>
                <button onClick={logout} className="btn btn-secondary">
                    <LogOut size={18} /> Cerrar Sesión
                </button>
            </div>

            {/* Modules Grid */}
            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {/* Cotizador - Public */}
                <ModuleCard
                    title="Cotizar Envío"
                    description="Calcula costos y tiempos para tus envíos nacionales e internacionales."
                    icon={<FileText size={32} />}
                    onClick={() => router.push('/quote')}
                    color="var(--primary)"
                />

                {/* Rastrear - Public */}
                <ModuleCard
                    title="Rastrear Paquete"
                    description="Consulta el estatus en tiempo real de tu carga."
                    icon={<Package size={32} />}
                    onClick={() => router.push('/tracking')}
                    color="var(--accent)"
                />

                {/* Vehículos - Public/Admin */}
                <ModuleCard
                    title="Flota de Vehículos"
                    description={isAdmin ? "Gestiona y monitorea la flota." : "Conoce nuestra flota disponible."}
                    icon={<Truck size={32} />}
                    onClick={() => router.push('/vehicles')}
                    color="var(--secondary)"
                />

                {/* Conductores - Public/Admin */}
                <ModuleCard
                    title="Conductores"
                    description={isAdmin ? "Administra el personal operativo." : "Únete a nuestro equipo de conductores."}
                    icon={<Users size={32} />}
                    onClick={() => router.push('/drivers')}
                    color="var(--secondary)"
                />

                {/* Almacenes - Public/Admin */}
                <ModuleCard
                    title="Almacenes"
                    description={isAdmin ? "Gestión de inventario y capacidad." : "Solicita servicios de almacenaje."}
                    icon={<Warehouse size={32} />}
                    onClick={() => router.push('/storage')}
                    color="var(--secondary)"
                />

                {/* Admin - Protected */}
                <ModuleCard
                    title="Administración"
                    description="Panel de control general, reportes y configuraciones."
                    icon={<Settings size={32} />}
                    onClick={() => router.push('/admin')}
                    color="var(--primary)"
                    disabled={!isAdmin}
                    locked={!isAdmin}
                />
            </div>
        </main>
    );
}

function ModuleCard({ title, description, icon, onClick, color, disabled = false, locked = false }: any) {
    return (
        <div
            className="card"
            style={{
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                borderTop: `4px solid ${color}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'relative'
            }}
            onClick={!disabled ? onClick : undefined}
        >
            {locked && (
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--secondary)' }}>
                    <ShieldCheck size={20} />
                </div>
            )}
            <div style={{
                background: 'var(--secondary-bg)',
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: color
            }}>
                {icon}
            </div>
            <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{title}</h3>
                <p style={{ color: 'var(--secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>{description}</p>
            </div>
        </div>
    );
}
