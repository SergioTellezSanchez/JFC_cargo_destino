'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';

export default function DriversPage() {
    const { language } = useLanguage();
    const t = useTranslation(language);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingDriver, setEditingDriver] = useState<any>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newDriver, setNewDriver] = useState({
        name: '',
        email: '',
        phone: '',
        licenseNumber: '',
    });

    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        try {
            const res = await fetch('/api/drivers');
            const data = await res.json();
            setDrivers(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching drivers:', error);
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        console.log('Attempting to delete driver:', id);
        if (!confirm('¿Estás seguro de eliminar este conductor?')) return;
        try {
            const res = await fetch(`/api/drivers/${id}`, { method: 'DELETE' });
            if (res.ok) {
                console.log('Driver deleted successfully');
                setEditingDriver(null);
                fetchDrivers();
            } else {
                console.error('Failed to delete driver:', await res.text());
            }
        } catch (error) {
            console.error('Error deleting driver:', error);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Updating driver:', editingDriver);
        try {
            const res = await fetch(`/api/drivers/${editingDriver.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingDriver),
            });
            if (res.ok) {
                console.log('Driver updated successfully');
                setEditingDriver(null);
                fetchDrivers();
            } else {
                console.error('Failed to update driver:', await res.text());
            }
        } catch (error) {
            console.error('Error updating driver:', error);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/drivers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newDriver),
            });
            if (res.ok) {
                setShowCreateForm(false);
                setNewDriver({
                    name: '',
                    email: '',
                    phone: '',
                    licenseNumber: '',
                });
                fetchDrivers();
            }
        } catch (error) {
            console.error('Error creating driver:', error);
        }
    };

    if (loading) return <div className="container">Cargando...</div>;

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Gestionar Conductores</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
                        + Crear Conductor
                    </button>
                    <a href="/admin" className="btn btn-secondary">Volver al Panel</a>
                </div>
            </div>

            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Teléfono</th>
                            <th>Licencia</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {drivers.map((driver: any) => (
                            <tr key={driver.id}>
                                <td>{driver.name}</td>
                                <td>{driver.email}</td>
                                <td>{driver.phone || '-'}</td>
                                <td>{driver.licenseNumber || '-'}</td>
                                <td>
                                    <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => setEditingDriver(driver)}>
                                        ✏️ Editar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Driver Modal */}
            {showCreateForm && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ maxWidth: '800px', width: '90%' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Crear Conductor</h2>
                        <form onSubmit={handleCreate}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nombre</label>
                                <input className="input" style={{ width: '100%' }} value={newDriver.name} onChange={e => setNewDriver({ ...newDriver, name: e.target.value })} required />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
                                <input className="input" style={{ width: '100%' }} type="email" value={newDriver.email} onChange={e => setNewDriver({ ...newDriver, email: e.target.value })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Teléfono</label>
                                    <input className="input" style={{ width: '100%' }} value={newDriver.phone} onChange={e => setNewDriver({ ...newDriver, phone: e.target.value })} placeholder="55-1234-5678" />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Licencia</label>
                                    <input className="input" style={{ width: '100%' }} value={newDriver.licenseNumber} onChange={e => setNewDriver({ ...newDriver, licenseNumber: e.target.value })} placeholder="Licencia..." />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Crear</button>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreateForm(false)}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Driver Modal */}
            {editingDriver && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ maxWidth: '800px', width: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Editar Conductor</h2>
                            <button className="btn" style={{ background: 'transparent', color: '#666', fontSize: '1.5rem', padding: '0 0.5rem' }} onClick={() => setEditingDriver(null)}>×</button>
                        </div>
                        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nombre</label>
                                <input className="input" style={{ width: '100%' }} value={editingDriver.name} onChange={e => setEditingDriver({ ...editingDriver, name: e.target.value })} required />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
                                <input className="input" style={{ width: '100%' }} value={editingDriver.email} onChange={e => setEditingDriver({ ...editingDriver, email: e.target.value })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Teléfono</label>
                                    <input className="input" style={{ width: '100%' }} value={editingDriver.phone || ''} onChange={e => setEditingDriver({ ...editingDriver, phone: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Licencia</label>
                                    <input className="input" style={{ width: '100%' }} value={editingDriver.licenseNumber || ''} onChange={e => setEditingDriver({ ...editingDriver, licenseNumber: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Actualizar</button>
                                <button type="button" className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(editingDriver.id)}>Eliminar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
