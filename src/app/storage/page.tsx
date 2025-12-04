'use client';

import { useState, useEffect } from 'react';
import { getStorageLocations, createStorageLocation } from '@/app/actions/storage';
import { Package, Check, X, Warehouse } from 'lucide-react';

export default function StoragePage() {
    const [locations, setLocations] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        location: '',
        capacity: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [locs, reqs] = await Promise.all([
                getStorageLocations(),
                fetch('/api/packages?storageStatus=REQUESTED').then(res => res.json())
            ]);
            setLocations(locs);
            setRequests(reqs);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createStorageLocation(formData);
            setFormData({ location: '', capacity: '' });
            loadData();
        } catch (error) {
            console.error(error);
            alert('Error creating storage location');
        }
    };

    const handleRequest = async (packageId: string, action: 'APPROVE' | 'REJECT', storageId?: string) => {
        try {
            const response = await fetch(`/api/packages/${packageId}/storage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, storageId })
            });

            if (response.ok) {
                loadData();
            } else {
                alert('Error processing request');
            }
        } catch (error) {
            console.error(error);
            alert('Error processing request');
        }
    };

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem', fontWeight: 'bold' }}>Gestión de Almacenes</h1>

            {/* Pending Requests Section */}
            <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--accent)' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Package size={24} /> Solicitudes de Almacenaje Pendientes
                </h2>
                {requests.length === 0 ? (
                    <p style={{ color: 'var(--secondary)' }}>No hay solicitudes pendientes.</p>
                ) : (
                    <div className="responsive-grid">
                        {requests.map((req) => (
                            <div key={req.id} className="card" style={{ padding: '1rem', border: '1px solid var(--border)' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{req.trackingId}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '1rem' }}>
                                    {req.recipientName} - {req.weight}kg
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className="btn btn-success"
                                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}
                                        onClick={() => {
                                            // For simplicity, auto-assign to first available location or just approve without location for now
                                            // Ideally open a modal to select location.
                                            // Let's just approve as "APPROVED" status for now.
                                            handleRequest(req.id, 'APPROVE');
                                        }}
                                    >
                                        <Check size={16} /> Aprobar
                                    </button>
                                    <button
                                        className="btn btn-danger"
                                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}
                                        onClick={() => handleRequest(req.id, 'REJECT')}
                                    >
                                        <X size={16} /> Rechazar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="responsive-grid" style={{ alignItems: 'flex-start', gap: '2rem' }}>
                {/* Add Location Form */}
                <div className="card" style={{ flex: 1, minWidth: '300px' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '600' }}>Agregar Almacén</h2>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nombre / Ubicación</label>
                            <input
                                type="text"
                                className="input"
                                required
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Ej. Bodega Norte"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Capacidad (Unidades)</label>
                            <input
                                type="number"
                                className="input"
                                required
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">Crear Almacén</button>
                    </form>
                </div>

                {/* Locations List */}
                <div style={{ flex: 2, minWidth: '300px' }}>
                    <div className="card">
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Warehouse size={24} /> Almacenes Activos
                        </h2>
                        {loading ? (
                            <p>Cargando...</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {locations.map((loc) => (
                                    <div key={loc.id} style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{loc.location}</h3>
                                            <span className="badge badge-assigned">
                                                {loc.currentLoad || 0} / {loc.capacity} Unidades
                                            </span>
                                        </div>
                                        <div style={{ background: 'var(--secondary-bg)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                                            <div
                                                style={{
                                                    width: `${Math.min(((loc.currentLoad || 0) / loc.capacity) * 100, 100)}%`,
                                                    background: 'var(--primary)',
                                                    height: '100%'
                                                }}
                                            />
                                        </div>
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--secondary)' }}>
                                            {loc.packages && loc.packages.length > 0 ? (
                                                <span>Paquetes almacenados: {loc.packages.length}</span>
                                            ) : (
                                                <span>Sin paquetes</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {locations.length === 0 && (
                                    <p style={{ color: 'var(--secondary)', textAlign: 'center' }}>No hay almacenes registrados.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
