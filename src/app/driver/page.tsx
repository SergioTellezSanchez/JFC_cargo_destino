'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Clock, Scale, Package, Navigation, Camera, Check, Truck, Users } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { authenticatedFetch } from '@/lib/api';

export default function DriverApp() {
    const { language } = useLanguage();
    const t = useTranslation(language);

    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [drivers, setDrivers] = useState([]);
    const [currentDriverId, setCurrentDriverId] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
    const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

    // Default center (Atlacomulco)
    const defaultCenter = { lat: 19.7968, lng: -99.7908 };

    useEffect(() => {
        fetchDrivers();

        // Get driver's current location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setDriverLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => console.error('Error getting location:', error)
            );
        }
    }, []);

    useEffect(() => {
        if (currentDriverId) {
            fetchDeliveries();
        }
    }, [currentDriverId]);

    const fetchDrivers = async () => {
        try {
            const driversRes = await authenticatedFetch('/api/drivers');
            const driversData = await driversRes.json();
            setDrivers(driversData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching drivers:', error);
            setLoading(false);
        }
    };

    const fetchDeliveries = async () => {
        setLoading(true);
        try {
            const packagesRes = await authenticatedFetch('/api/packages');
            const packages = await packagesRes.json();

            const myDeliveries = packages
                .map((pkg: any) => pkg.deliveries[0])
                .filter((d: any) => d && d.driverId === currentDriverId)
                .map((d: any) => ({
                    ...d,
                    package: packages.find((p: any) => p.id === d.packageId)
                }));

            setDeliveries(myDeliveries);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching deliveries:', error);
            setLoading(false);
        }
    };

    const updateStatus = async (deliveryId: string, action: string, file?: File | null) => {
        try {
            let body;
            const headers: Record<string, string> = {};

            if (file) {
                const formData = new FormData();
                formData.append('deliveryId', deliveryId);
                formData.append('action', action);
                formData.append('evidence', file);
                body = formData;
            } else {
                body = JSON.stringify({ deliveryId, action });
                headers['Content-Type'] = 'application/json';
            }

            const response = await authenticatedFetch('/api/deliveries/update', {
                method: 'POST',
                headers,
                body,
            });

            if (response.ok) {
                fetchDeliveries();
                setSelectedDelivery(null);
                setEvidenceFile(null);
            } else {
                console.error('Failed to update status:', await response.text());
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setEvidenceFile(e.target.files[0]);
        }
    };

    const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && currentDriverId) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('photo', file);

            try {
                const res = await authenticatedFetch(`/api/drivers/${currentDriverId}`, {
                    method: 'PUT',
                    body: formData
                });
                if (res.ok) {
                    fetchDrivers(); // Refresh to get new photoUrl
                }
            } catch (err) { console.error(err); }
        }
    };

    const openNavigation = (pkg: any) => {
        const destination = pkg.latitude && pkg.longitude
            ? `${pkg.latitude},${pkg.longitude}`
            : encodeURIComponent(`${pkg.address}, ${pkg.postalCode}`);

        window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
    };

    const getPinColor = (status: string) => {
        switch (status) {
            case 'ASSIGNED': return '#FBBC04';
            case 'LOADING': return '#4285F4';
            case 'IN_TRANSIT': return '#34A853';
            case 'UNLOADING': return '#1F4A5E';
            case 'DELIVERED': return '#9AA0A6';
            case 'FAILED': return '#EA4335';
            default: return '#FBBC04';
        }
    };

    if (loading && !currentDriverId && drivers.length === 0) return <div className="container">{t('loading')}</div>;

    // Driver Selection Screen
    if (!currentDriverId) {
        return (
            <div className="container" style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '80vh' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Selecciona tu Perfil</h1>
                <div className="card">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {drivers.map((driver: any) => (
                            <button
                                key={driver.id}
                                className="btn btn-secondary"
                                style={{ padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                onClick={() => setCurrentDriverId(driver.id)}
                            >
                                <span style={{ fontWeight: 'bold' }}>{driver.name}</span>
                                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Driver</span>
                            </button>
                        ))}
                        {drivers.length === 0 && (
                            <p style={{ textAlign: 'center' }}>No hay conductores registrados.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
            <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem', height: '100vh', display: 'flex', flexDirection: 'column' }}>
                {/* Driver Profile Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem', background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', background: 'var(--secondary-bg)', border: '2px solid var(--primary-light)' }}>
                                {(() => {
                                    const curr = drivers.find((d: any) => d.id === currentDriverId) as any;
                                    return curr?.photoUrl ? (
                                        <img src={curr.photoUrl} alt="Me" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <Users size={24} style={{ margin: '14px auto', display: 'block', color: 'var(--secondary)' }} />
                                    );
                                })()}
                            </div>
                            <label htmlFor="profile-photo" style={{ position: 'absolute', bottom: -2, right: -2, background: 'var(--primary)', color: 'white', borderRadius: '50%', padding: '6px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', display: 'flex' }}>
                                <Camera size={14} />
                            </label>
                            <input id="profile-photo" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProfilePhotoChange} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--foreground)' }}>
                                {(drivers.find((d: any) => d.id === currentDriverId) as any)?.name}
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--secondary)' }}>
                                {(drivers.find((d: any) => d.id === currentDriverId) as any)?.company || 'Conductor Independiente'}
                            </p>
                        </div>
                    </div>
                    <button className="btn btn-secondary" onClick={() => setCurrentDriverId('')} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>Cerrar Sesión</button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('myRoute')}</h1>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--secondary-bg)', padding: '0.25rem', borderRadius: '12px' }}>
                        <button
                            className={`btn ${viewMode === 'list' ? 'btn-primary' : ''}`}
                            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', borderRadius: '10px', boxShadow: viewMode === 'list' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}
                            onClick={() => setViewMode('list')}
                        >
                            Lista
                        </button>
                        <button
                            className={`btn ${viewMode === 'map' ? 'btn-primary' : ''}`}
                            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', borderRadius: '10px', boxShadow: viewMode === 'map' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}
                            onClick={() => setViewMode('map')}
                        >
                            Mapa
                        </button>
                    </div>
                </div>

                {viewMode === 'list' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                        {deliveries.length === 0 ? (
                            <p>{t('noActiveDeliveries')}</p>
                        ) : (
                            deliveries.map((delivery: any) => {
                                const status = delivery.status;
                                const pkg = delivery.package;

                                return (
                                    <div key={delivery.id} className="card" style={{ padding: '1.5rem', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                                        {/* Header: Tracking & Status */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                                            <span style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--foreground)' }}>{pkg.trackingId}</span>
                                            <span className={`badge badge-${status.toLowerCase()}`} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                                                {t(status as any)}
                                            </span>
                                        </div>

                                        {/* Details Grid */}
                                        <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                                            {/* Recipient */}
                                            <div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--secondary)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '0.25rem' }}>
                                                    {t('to')}
                                                </div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--foreground)' }}>
                                                    {pkg.recipientName}
                                                </div>
                                            </div>

                                            {/* Address */}
                                            <div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--secondary)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '0.25rem' }}>
                                                    {t('address')}
                                                </div>
                                                <div style={{ fontSize: '1rem', color: 'var(--foreground)', lineHeight: '1.5' }}>
                                                    {pkg.address}
                                                </div>
                                            </div>

                                            {/* Package Specs */}
                                            {(pkg.weight || pkg.size) && (
                                                <div style={{ display: 'flex', gap: '1rem', background: 'var(--background)', padding: '0.75rem', borderRadius: '8px' }}>
                                                    {pkg.weight && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <div style={{ background: 'var(--secondary-bg)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                                                                <span style={{ fontSize: '1.2rem' }}><Scale size={20} /></span>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Peso</div>
                                                                <div style={{ fontWeight: 'bold' }}>{pkg.weight} kg</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {pkg.size && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <div style={{ background: 'var(--secondary-bg)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                                                                <span style={{ fontSize: '1.2rem' }}><Package size={20} /></span>
                                                            </div>
                                                            <div>
                                                                <span style={{ fontWeight: '600' }}>{pkg.size}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {/* Navigation Button (Secondary) */}
                                            <button
                                                className="btn btn-secondary"
                                                style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                                onClick={() => openNavigation(pkg)}
                                            >
                                                <Navigation size={18} /> Navegar
                                            </button>

                                            {/* Primary Actions based on Status */}
                                            {status === 'ASSIGNED' && (
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}
                                                    onClick={() => updateStatus(delivery.id, 'CONFIRM_ARRIVAL_ORIGIN')}
                                                >
                                                    Confirmar Llegada a Carga
                                                </button>
                                            )}

                                            {status === 'LOADING' && (
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ width: '100%', justifyContent: 'center', padding: '1rem', background: '#3b82f6' }}
                                                    onClick={() => updateStatus(delivery.id, 'START_TRANSIT')}
                                                >
                                                    Iniciar Tránsito
                                                </button>
                                            )}

                                            {status === 'IN_TRANSIT' && (
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ width: '100%', justifyContent: 'center', padding: '1rem', background: '#10b981' }}
                                                    onClick={() => updateStatus(delivery.id, 'CONFIRM_ARRIVAL_DESTINATION')}
                                                >
                                                    Llegada a Destino (Descarga)
                                                </button>
                                            )}

                                            {status === 'UNLOADING' && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <label
                                                            htmlFor={`evidence-${delivery.id}`}
                                                            className={`btn ${evidenceFile ? 'btn-success' : 'btn-secondary'}`}
                                                            style={{ flex: 1, justifyContent: 'center', cursor: 'pointer', border: evidenceFile ? 'none' : '2px dashed var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                                        >
                                                            {evidenceFile ? <><Check size={18} /> Evidencia Lista</> : <><Camera size={18} /> Tomar Foto Evidencia</>}
                                                        </label>
                                                        <input
                                                            id={`evidence-${delivery.id}`}
                                                            type="file"
                                                            accept="image/*"
                                                            capture="environment"
                                                            style={{ display: 'none' }}
                                                            onChange={handleFileChange}
                                                        />
                                                    </div>

                                                    <button
                                                        className="btn btn-success"
                                                        style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}
                                                        onClick={() => updateStatus(delivery.id, 'CONFIRM_DELIVERY', evidenceFile)}
                                                    >
                                                        Finalizar Entrega
                                                    </button>
                                                </div>
                                            )}

                                            {status === 'DELIVERED' && (
                                                <div style={{ width: '100%', textAlign: 'center', padding: '1rem', background: '#dcfce7', borderRadius: '8px', color: 'var(--success)', fontWeight: 'bold' }}>
                                                    {t('completed')}
                                                    {delivery.evidenceUrl && (
                                                        <a href={delivery.evidenceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: '0.9rem', marginTop: '0.5rem', color: 'var(--success)', textDecoration: 'underline' }}>
                                                            Ver Evidencia
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee' }}>
                        <Map
                            defaultCenter={driverLocation || defaultCenter}
                            defaultZoom={13}
                            mapId="DRIVER_MAP_ID"
                            style={{ width: '100%', height: '100%' }}
                        >
                            {driverLocation && (
                                <AdvancedMarker position={driverLocation}>
                                    <div style={{ color: 'var(--secondary)' }}><Truck size={48} /></div>
                                </AdvancedMarker>
                            )}

                            {deliveries.map((delivery: any) => {
                                const pkg = delivery.package;
                                const position = pkg.latitude && pkg.longitude
                                    ? { lat: pkg.latitude, lng: pkg.longitude }
                                    : null;

                                if (!position) return null;

                                return (
                                    <AdvancedMarker
                                        key={delivery.id}
                                        position={position}
                                        onClick={() => setSelectedDelivery(delivery)}
                                    >
                                        <div style={{ fontSize: '2rem', cursor: 'pointer' }}>
                                            {delivery.status === 'DELIVERED' ? <CheckCircle size={24} color="var(--success)" /> :
                                                delivery.status === 'FAILED' ? <AlertTriangle size={24} color="var(--error)" /> :
                                                    <Clock size={24} color="var(--secondary)" />}
                                        </div>
                                    </AdvancedMarker>
                                );
                            })}

                            {selectedDelivery && (
                                <InfoWindow
                                    position={{
                                        lat: selectedDelivery.package.latitude,
                                        lng: selectedDelivery.package.longitude
                                    }}
                                    onCloseClick={() => setSelectedDelivery(null)}
                                >
                                    <div style={{ padding: '0.5rem', maxWidth: '200px' }}>
                                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>{selectedDelivery.package.recipientName}</h3>
                                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem' }}>{selectedDelivery.package.address}</p>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <span className={`badge badge-${selectedDelivery.status.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>
                                                {t(selectedDelivery.status as any)}
                                            </span>
                                        </div>
                                        <button
                                            className="btn btn-primary"
                                            style={{ width: '100%', fontSize: '0.8rem', padding: '0.25rem' }}
                                            onClick={() => openNavigation(selectedDelivery.package)}
                                        >
                                            Navegar
                                        </button>

                                        {selectedDelivery.status === 'IN_TRANSIT' && (
                                            <button
                                                className="btn"
                                                style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.25rem', background: 'var(--success)', color: 'white' }}
                                                onClick={() => updateStatus(selectedDelivery.id, 'CONFIRM_DELIVERY')}
                                            >
                                                {t('delivered')}
                                            </button>
                                        )}
                                    </div>
                                </InfoWindow>
                            )}
                        </Map>
                    </div>
                )}
            </div>
        </APIProvider>
    );
}
