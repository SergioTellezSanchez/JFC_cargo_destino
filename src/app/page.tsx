'use client';

import { useRouter } from 'next/navigation';
import { Truck, Package, Users, Warehouse, Settings, FileText, ShieldCheck } from 'lucide-react';
import { useUser } from '@/lib/UserContext';

export default function Dashboard() {
    const router = useRouter();
    const { user, loading, loginWithGoogle, isAdmin } = useUser();

    if (loading) {
        return (
            <main className="container" style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="text-center">
                    <h2 className="text-xl font-bold">Cargando...</h2>
                </div>
            </main>
        );
    }

    if (!user) {
        return (
            <main className="container" style={{ minHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                        <img
                            src="/jfc_carg-_destino_logo.png"
                            alt="JFC Cargo Destino"
                            style={{ height: '180px', width: 'auto' }}
                        />
                    </div>
                </div>

                <div className="card" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem', textAlign: 'center' }}>
                    <h3 style={{ marginBottom: '2rem', fontWeight: 'bold', fontSize: '1.5rem' }}>Iniciar Sesión</h3>

                    <button
                        onClick={() => loginWithGoogle()}
                        className="btn"
                        style={{
                            width: '100%',
                            padding: '1rem',
                            fontSize: '1.1rem',
                            background: 'white',
                            color: '#757575',
                            border: '1px solid #ddd',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '1rem'
                        }}
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '24px', height: '24px' }} />
                        Continuar con Google
                    </button>

                    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', fontSize: '0.9rem', color: 'var(--secondary)' }}>
                        <p>Acceso seguro vía Google Workspace</p>
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
