'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { APIProvider, Map, AdvancedMarker, Pin, MapMouseEvent } from '@vis.gl/react-google-maps';

export default function AdminDashboard() {
    const { language } = useLanguage();
    const t = useTranslation(language);

    const [packages, setPackages] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPackageForm, setShowPackageForm] = useState(false);

    const [showMapPicker, setShowMapPicker] = useState(false);

    // Package form state
    const [newPackage, setNewPackage] = useState({
        trackingId: '',
        recipientName: '',
        address: '',
        postalCode: '',
        weight: '',
        size: 'MEDIUM',
        latitude: null as number | null,
        longitude: null as number | null,
        instructions: '',
        leaveWithSecurity: false,
    });

    // Map state
    const [mapCenter, setMapCenter] = useState({ lat: 19.7968, lng: -99.7908 }); // Atlacomulco default
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [showGlobalMap, setShowGlobalMap] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [packagesRes, driversRes] = await Promise.all([
                fetch('/api/packages'),
                fetch('/api/drivers')
            ]);

            if (!packagesRes.ok) {
                const text = await packagesRes.text();
                throw new Error(`Failed to fetch packages: ${packagesRes.status} ${text}`);
            }
            if (!driversRes.ok) {
                const text = await driversRes.text();
                throw new Error(`Failed to fetch drivers: ${driversRes.status} ${text}`);
            }

            const packagesData = await packagesRes.json();
            const driversData = await driversRes.json();
            setPackages(packagesData);
            setDrivers(driversData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const assignDriver = async (packageId: string, driverId: string) => {
        console.log('Assigning driver:', { packageId, driverId });
        if (!driverId) return;
        try {
            const response = await fetch('/api/deliveries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ packageId, driverId }),
            });
            if (response.ok) {
                console.log('Driver assigned successfully');
                fetchData(); // Refresh data
            } else {
                console.error('Failed to assign driver:', await response.text());
            }
        } catch (error) {
            console.error('Error assigning driver:', error);
        }
    };

    const createPackage = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Creating package:', newPackage);
        try {
            const trackingId = newPackage.trackingId || `PKG-${Date.now().toString().slice(-6)}`;
            const response = await fetch('/api/packages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newPackage,
                    trackingId,
                    weight: parseFloat(newPackage.weight) || 0,
                }),
            });
            if (response.ok) {
                console.log('Package created successfully');
                setShowPackageForm(false);
                setNewPackage({
                    trackingId: '',
                    recipientName: '',
                    address: '',
                    postalCode: '',
                    weight: '',
                    size: 'MEDIUM',
                    latitude: null,
                    longitude: null,
                    instructions: '',
                    leaveWithSecurity: false,
                });
                fetchData();
            } else {
                console.error('Failed to create package:', await response.text());
            }
        } catch (error) {
            console.error('Error creating package:', error);
        }
    };

    const handleMapClick = async (e: MapMouseEvent) => {
        if (e.detail.latLng) {
            const lat = e.detail.latLng.lat;
            const lng = e.detail.latLng.lng;
            setSelectedLocation({ lat, lng });

            // Reverse geocoding
            try {
                const geocoder = new google.maps.Geocoder();
                const response = await geocoder.geocode({ location: { lat, lng } });

                if (response.results[0]) {
                    const result = response.results[0];
                    const address = result.formatted_address;

                    // Extract postal code
                    const postalCodeComponent = result.address_components.find(
                        component => component.types.includes('postal_code')
                    );
                    const postalCode = postalCodeComponent ? postalCodeComponent.long_name : '';

                    setNewPackage(prev => ({
                        ...prev,
                        address,
                        postalCode,
                        latitude: lat,
                        longitude: lng
                    }));
                }
            } catch (error) {
                console.error('Geocoding error:', error);
                // Still set coordinates even if geocoding fails
                setNewPackage(prev => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng
                }));
            }
        }
    };

    const confirmLocation = () => {
        setShowMapPicker(false);
    };

    if (loading) return <div className="container">{t('loading')}</div>;

    return (
        <div className="container">
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem', fontWeight: 'bold' }}>{t('adminDashboard')}</h1>

            <div className="responsive-actions">
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <button
                        className="btn btn-success"
                        style={{ textDecoration: 'none' }}
                        onClick={(e) => {
                            console.log('Create Package button clicked');
                            e.stopPropagation();
                            setShowPackageForm(true);
                        }}
                    >
                        {t('createPackage')}
                    </button>
                </div>
                <a href="/admin/drivers" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                    {t('manageDrivers')}
                </a>
                <button
                    className="btn btn-secondary"
                    onClick={() => setShowGlobalMap(true)}
                >
                    {t('viewGlobalMap')}
                </button>
            </div>

            <div className="card" style={{ overflowX: 'auto' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{t('packages')}</h2>
                <table className="table">
                    <thead>
                        <tr>
                            <th>{t('trackingId')}</th>
                            <th>{t('recipient')}</th>
                            <th style={{ minWidth: '300px', whiteSpace: 'normal' }}>{t('address')}</th>
                            <th>CP</th>
                            <th>{t('deliveryLocation')}</th>
                            <th>{t('status')}</th>
                            <th>{t('assignedDriver')}</th>
                            <th>{t('driverLocation')}</th>
                            <th>{t('evidence')}</th>
                            <th>{t('action')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {packages.map((pkg: any) => {
                            const currentDelivery = pkg.deliveries?.[0];
                            const status = currentDelivery?.status || 'PENDING';
                            const driver = currentDelivery?.driver;

                            return (
                                <tr key={pkg.id} style={{ height: '60px' }}>
                                    <td>{pkg.trackingId}</td>
                                    <td>{pkg.recipientName}</td>
                                    <td style={{ whiteSpace: 'normal' }}>{pkg.address}</td>
                                    <td>{pkg.postalCode}</td>
                                    <td>
                                        {pkg.latitude && pkg.longitude ? (
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${pkg.latitude},${pkg.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-secondary"
                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                            >
                                                🗺️ {t('viewMap')}
                                            </a>
                                        ) : (
                                            <span style={{ color: '#94a3b8' }}>{t('noLocation')}</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`badge badge-${status.toLowerCase()}`}>
                                            {t(status as any)}
                                        </span>
                                    </td>
                                    <td>
                                        {driver?.name || t('unassigned')}
                                    </td>
                                    <td>
                                        {driver?.latitude && driver?.longitude ? (
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${driver.latitude},${driver.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title={t('driverLocation')}
                                                style={{ fontSize: '1.5rem', textDecoration: 'none' }}
                                            >
                                                🚗
                                            </a>
                                        ) : (
                                            <span style={{ color: '#94a3b8' }}>-</span>
                                        )}
                                    </td>
                                    <td>
                                        {currentDelivery?.evidenceUrl ? (
                                            <div
                                                style={{ width: '50px', height: '50px', cursor: 'pointer', overflow: 'hidden', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                                                onClick={() => window.open(currentDelivery.evidenceUrl, '_blank')}
                                            >
                                                <img
                                                    src={currentDelivery.evidenceUrl}
                                                    alt="Evidence"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                        ) : (
                                            <span style={{ color: '#94a3b8' }}>-</span>
                                        )}
                                    </td>
                                    <td>
                                        {status === 'PENDING' && (
                                            <select
                                                className="input"
                                                style={{ width: 'auto', padding: '0.5rem' }}
                                                onChange={async (e) => {
                                                    await assignDriver(pkg.id, e.target.value);
                                                }}
                                                defaultValue=""
                                            >
                                                <option value="" disabled>{t('assignDriver')}</option>
                                                {drivers.map((driver: any) => (
                                                    <option key={driver.id} value={driver.id}>
                                                        {driver.name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Create Package Modal */}
            {showPackageForm && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ maxWidth: '900px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{t('createPackage')}</h2>
                        <form onSubmit={createPackage} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                            {/* Recipient & Map Button */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>{t('recipient')}</label>
                                    <input
                                        className="input"
                                        value={newPackage.recipientName}
                                        onChange={e => setNewPackage({ ...newPackage, recipientName: e.target.value })}
                                        required
                                        placeholder={t('recipientName')}
                                    />
                                </div>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowMapPicker(true)} style={{ height: 'auto' }}>
                                    {t('selectLocation')}
                                </button>
                            </div>

                            {/* Address & CP Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>{t('address')}</label>
                                    <input
                                        className="input"
                                        value={newPackage.address}
                                        readOnly
                                        placeholder={t('address')}
                                        required
                                        style={{ background: '#f8fafc' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>CP</label>
                                    <input
                                        className="input"
                                        value={newPackage.postalCode}
                                        readOnly
                                        placeholder="CP"
                                        required
                                        style={{ background: '#f8fafc' }}
                                    />
                                </div>
                            </div>

                            {/* Weight & Size Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>{t('weight')}</label>
                                    <input
                                        className="input"
                                        type="number"
                                        step="0.1"
                                        value={newPackage.weight}
                                        onChange={e => setNewPackage({ ...newPackage, weight: e.target.value })}
                                        placeholder="0.0"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>{t('size')}</label>
                                    <select
                                        className="input"
                                        value={newPackage.size}
                                        onChange={e => setNewPackage({ ...newPackage, size: e.target.value })}
                                    >
                                        <option value="SMALL">{t('small')}</option>
                                        <option value="MEDIUM">{t('medium')}</option>
                                        <option value="LARGE">{t('large')}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>{t('instructionsLabel')}</label>
                                <textarea
                                    className="input"
                                    value={newPackage.instructions}
                                    onChange={e => setNewPackage({ ...newPackage, instructions: e.target.value })}
                                    rows={3}
                                    placeholder={t('instructionsLabel')}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            {/* Security Checkbox */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <input
                                    type="checkbox"
                                    id="leaveWithSecurity"
                                    checked={newPackage.leaveWithSecurity}
                                    onChange={e => setNewPackage({ ...newPackage, leaveWithSecurity: e.target.checked })}
                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                />
                                <label htmlFor="leaveWithSecurity" style={{ cursor: 'pointer', fontWeight: '500' }}>
                                    {t('securityLabel')}
                                </label>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowPackageForm(false)}>{t('cancel')}</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{t('create')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Map Picker Modal */}
            {showMapPicker && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div className="card" style={{ width: '90%', height: '80vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Seleccionar ubicación de entrega</h3>
                            <button className="btn" onClick={() => setShowMapPicker(false)}>✕</button>
                        </div>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
                                <Map
                                    defaultCenter={mapCenter}
                                    defaultZoom={13}
                                    mapId="DEMO_MAP_ID"
                                    onClick={handleMapClick}
                                    style={{ width: '100%', height: '100%' }}
                                >
                                    {selectedLocation && (
                                        <AdvancedMarker position={selectedLocation}>
                                            <Pin background={'#FBBC04'} glyphColor={'#000'} borderColor={'#000'} />
                                        </AdvancedMarker>
                                    )}
                                </Map>
                            </APIProvider>
                        </div>
                        <div style={{ padding: '1rem', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button className="btn" onClick={() => setShowMapPicker(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={confirmLocation} disabled={!selectedLocation}>
                                Confirmar Ubicación
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Map Modal */}
            {showGlobalMap && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div className="card" style={{ width: '90%', height: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Mapa Global de Entregas</h3>
                            <button className="btn" onClick={() => setShowGlobalMap(false)}>✕</button>
                        </div>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
                                <Map
                                    defaultCenter={mapCenter}
                                    defaultZoom={12}
                                    mapId="GLOBAL_MAP_ID"
                                    style={{ width: '100%', height: '100%' }}
                                >
                                    {packages.map((pkg: any) => {
                                        if (!pkg.latitude || !pkg.longitude) return null;
                                        const delivery = pkg.deliveries?.[0];
                                        const status = delivery?.status || 'PENDING';
                                        const driverName = delivery?.driver?.name || 'Sin asignar';

                                        return (
                                            <AdvancedMarker
                                                key={pkg.id}
                                                position={{ lat: pkg.latitude, lng: pkg.longitude }}
                                            >
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <div style={{ fontSize: '2rem' }}>
                                                        {status === 'DELIVERED' ? '✅' :
                                                            status === 'FAILED' ? '⚠️' :
                                                                '🕒'}
                                                    </div>
                                                    <div style={{ background: 'white', padding: '2px 5px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
                                                        {driverName}
                                                    </div>
                                                </div>
                                            </AdvancedMarker>
                                        );
                                    })}
                                </Map>
                            </APIProvider>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
