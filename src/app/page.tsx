'use client';

import { useRouter } from 'next/navigation';
import { Truck, Package, Users, Warehouse, Settings, FileText, ShieldCheck, History } from 'lucide-react';
import { useUser } from '@/lib/UserContext';

import { useLanguage } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';

export default function Dashboard() {
    const router = useRouter();
    const { user, loading, loginWithGoogle, isAdmin } = useUser();
    const { language } = useLanguage();
    const t = useTranslation(language);

    if (loading) {
        return (
            <main className="container" style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="text-center">
                    <h2 className="text-xl font-bold">{t('loading')}</h2>
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
                        {t('dashboardTitle')}
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--secondary)' }}>
                        {t('welcome')}, {user.name}
                    </p>
                </div>
            </div>

            {/* Section: Mis Servicios */}
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--foreground)' }}>
                {t('myServices')}
            </h2>
            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                {/* Cotizador */}
                <ModuleCard
                    title={t('quoteTitle')}
                    description={t('quoteDesc')}
                    icon={<FileText size={32} color="white" />}
                    onClick={() => router.push('/quote')}
                    gradient="linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)"
                />

                {/* Rastrear */}
                <ModuleCard
                    title={t('trackTitle')}
                    description={t('trackDesc')}
                    icon={<Package size={32} color="white" />}
                    onClick={() => router.push('/tracking')}
                    gradient="linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)"
                />

                {/* Mis Servicios (New) */}
                <ModuleCard
                    title={t('myServices')}
                    description="Gestiona tus paquetes y consulta tu historial de envíos."
                    icon={<History size={32} color="white" />}
                    onClick={() => router.push('/my-services')}
                    gradient="linear-gradient(135deg, var(--accent) 0%, #c5a059 100%)"
                />
            </div>

            {/* Section: Gestión */}
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--foreground)' }}>
                {t('management')}
            </h2>
            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                {/* Vehículos */}
                <ModuleCard
                    title={t('fleetTitle')}
                    description={t('fleetDesc')}
                    icon={<Truck size={32} color="white" />}
                    onClick={() => router.push('/vehicles')}
                    gradient="linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)"
                />

                {/* Conductores */}
                <ModuleCard
                    title={t('driversTitle')}
                    description={t('driversDesc')}
                    icon={<Users size={32} color="white" />}
                    onClick={() => router.push('/drivers')}
                    gradient="linear-gradient(135deg, var(--secondary) 0%, var(--primary-hover) 100%)"
                />

                {/* Almacenes */}
                <ModuleCard
                    title={t('warehousesTitle')}
                    description={t('warehousesDesc')}
                    icon={<Warehouse size={32} color="white" />}
                    onClick={() => router.push('/storage')}
                    gradient="linear-gradient(135deg, var(--accent) 0%, #c5a059 100%)"
                />

                {/* Admin */}
                <ModuleCard
                    title={t('adminTitle')}
                    description={t('adminPanelDesc')}
                    icon={<Settings size={32} color="white" />}
                    onClick={() => router.push('/admin')}
                    gradient="linear-gradient(135deg, var(--foreground) 0%, #000000 100%)"
                    disabled={!isAdmin}
                    locked={!isAdmin}
                />
            </div>
        </main>
    );
}

function ModuleCard({ title, description, icon, onClick, gradient, disabled = false, locked = false }: any) {
    return (
        <div
            className="card"
            style={{
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'relative',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
            onClick={!disabled ? onClick : undefined}
            onMouseEnter={(e) => {
                if (!disabled) {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                }
            }}
            onMouseLeave={(e) => {
                if (!disabled) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                }
            }}
        >
            {locked && (
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--secondary)' }}>
                    <ShieldCheck size={20} />
                </div>
            )}
            <div style={{
                background: gradient || 'var(--secondary-bg)',
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
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
