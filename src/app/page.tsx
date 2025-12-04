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

    return (
        <main className="container" style={{ minHeight: '90vh', padding: '2rem' }}>
            {/* Header & Welcome */}
            <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 className="text-gradient" style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1rem' }}>
                    JFC Cargo Destino
                </h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--secondary)' }}>
                    Plataforma Integral de Logística y Transporte
                </p>
            </div>

            {/* User Session / Login Demo */}
            <div className="card" style={{ marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
                {!user ? (
                    <div>
                        <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Iniciar Sesión (Demo)</h3>
                        <form onSubmit={handleLogin} style={{ display: 'flex', gap: '1rem' }}>
                            <input
                                type="email"
                                placeholder="Ingresa tu correo..."
                                className="input"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <button type="submit" className="btn btn-primary">
                                <LogIn size={18} /> Entrar
                            </button>
                        </form>
                        <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--secondary)' }}>
                            <p><strong>Admin:</strong> sergiotellezsanchez@gmail.com</p>
                            <p><strong>Usuario:</strong> Cualquier otro correo</p>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>Bienvenido,</div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{user.name}</div>
                            <div className={`badge ${isAdmin ? 'badge-assigned' : 'badge-pending'}`} style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                                {user.role}
                            </div>
                        </div>
                        <button onClick={logout} className="btn btn-secondary">
                            <LogOut size={18} /> Salir
                        </button>
                    </div>
                )}
            </div>

            {/* Modules Grid */}
            <div className="responsive-grid">
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
                    onClick={() => router.push('/tracking')} // Assuming tracking page exists or will be created
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
                    onClick={() => router.push('/drivers')} // Check if this route exists for listing
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
