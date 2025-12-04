'use client';

import { useState } from 'react';
import { Search, Package, MapPin, Warehouse, AlertCircle, CheckCircle } from 'lucide-react';

export default function TrackingPage() {
    const [trackingId, setTrackingId] = useState('');
    const [packageData, setPackageData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingId) return;

        setLoading(true);
        setError('');
        setPackageData(null);

        try {
            const response = await fetch(`/api/packages?trackingId=${trackingId}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    setPackageData(data[0]); // Assuming API returns array
                } else {
                    setError('Paquete no encontrado.');
                }
            } else {
                setError('Error al buscar el paquete.');
            }
        } catch (err) {
            setError('Error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    const requestStorage = async () => {
        if (!packageData) return;

        try {
            const response = await fetch(`/api/packages/${packageData.id}/storage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'REQUEST' })
            });

            if (response.ok) {
                // Refresh data
                const updatedPkg = await response.json();
                setPackageData(updatedPkg);
                alert('Solicitud de almacenaje enviada.');
            } else {
                alert('Error al solicitar almacenaje.');
            }
        } catch (err) {
            alert('Error de conexión.');
        }
    };

    return (
        <div className="container" style={{ maxWidth: '800px', padding: '2rem' }}>
            <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem', textAlign: 'center' }}>
                Rastrear Paquete
            </h1>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        className="input"
                        placeholder="Ingresa tu ID de seguimiento (ej. PKG-123456)"
                        value={trackingId}
                        onChange={(e) => setTrackingId(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Buscando...' : <><Search size={20} /> Buscar</>}
                    </button>
                </form>
                {error && <div style={{ color: 'var(--error)', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertCircle size={18} /> {error}</div>}
            </div>

            {packageData && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{packageData.trackingId}</h2>
                            <p style={{ color: 'var(--secondary)' }}>Destinatario: {packageData.recipientName}</p>
                        </div>
                        <div className={`badge badge-${(packageData.deliveries?.[0]?.status || 'PENDING').toLowerCase()}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                            {packageData.deliveries?.[0]?.status || 'PENDIENTE'}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={20} color="var(--accent)" /> Destino
                            </h3>
                            <p>{packageData.address}</p>
                            <p style={{ color: 'var(--secondary)' }}>CP: {packageData.postalCode}</p>
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Package size={20} color="var(--accent)" /> Detalles
                            </h3>
                            <p>Peso: {packageData.weight} kg</p>
                            <p>Tamaño: {packageData.size}</p>
                        </div>
                    </div>

                    {/* Storage Section */}
                    <div style={{ background: 'var(--secondary-bg)', padding: '1.5rem', borderRadius: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Warehouse size={20} /> Estatus de Almacenaje
                        </h3>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                {packageData.storageStatus === 'NONE' && <p>No se ha solicitado almacenaje.</p>}
                                {packageData.storageStatus === 'REQUESTED' && <p style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Solicitud en proceso...</p>}
                                {packageData.storageStatus === 'APPROVED' && <p style={{ color: 'var(--success)', fontWeight: 'bold' }}>Solicitud Aprobada. Espacio reservado.</p>}
                                {packageData.storageStatus === 'STORED' && <p style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Paquete en Almacén.</p>}
                                {packageData.storageStatus === 'REJECTED' && <p style={{ color: 'var(--error)', fontWeight: 'bold' }}>Solicitud Rechazada.</p>}
                            </div>

                            {packageData.storageStatus === 'NONE' && (
                                <button className="btn btn-secondary" onClick={requestStorage}>
                                    Solicitar Almacenaje
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
