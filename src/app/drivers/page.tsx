'use client';

import { useState, useEffect } from 'react';
import { getDrivers, createDriver, deleteDriver } from '@/app/actions/drivers';
import { User, Trash2, Plus, Phone, CreditCard } from 'lucide-react';

export default function DriversPage() {
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        licenseNumber: ''
    });

    useEffect(() => {
        loadDrivers();
    }, []);

    const loadDrivers = async () => {
        setLoading(true);
        try {
            const data = await getDrivers();
            setDrivers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createDriver(formData);
            setFormData({
                name: '',
                email: '',
                phone: '',
                licenseNumber: ''
            });
            loadDrivers();
        } catch (error) {
            console.error(error);
            alert('Error al crear conductor');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este conductor?')) {
            await deleteDriver(id);
            loadDrivers();
        }
    };

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '2rem', fontWeight: 'bold' }}>Gestión de Conductores</h1>

            <div className="responsive-grid" style={{ alignItems: 'flex-start', gap: '2rem' }}>
                {/* Add Driver Form */}
                <div className="card" style={{ flex: 1, minWidth: '300px' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={20} /> Agregar Conductor
                    </h2>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Nombre Completo</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Ej. Juan Pérez"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Correo Electrónico</label>
                            <input
                                type="email"
                                className="input"
                                placeholder="juan@ejemplo.com"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Teléfono</label>
                            <input
                                type="tel"
                                className="input"
                                placeholder="55 1234 5678"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Licencia</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="LIC-123456"
                                required
                                value={formData.licenseNumber}
                                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                            <Plus size={18} /> Registrar Conductor
                        </button>
                    </form>
                </div>

                {/* Driver List */}
                <div style={{ flex: 2, minWidth: '300px' }}>
                    <div className="card">
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={24} /> Conductores Activos
                        </h2>
                        {loading ? (
                            <p>Cargando...</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {drivers.map((driver) => (
                                    <div key={driver.id} className="card" style={{ border: '1px solid var(--border)', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>
                                                {driver.name}
                                            </h3>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '0.25rem' }}>
                                                {driver.email}
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: 'var(--secondary)' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={14} /> {driver.phone}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CreditCard size={14} /> {driver.licenseNumber}</span>
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-danger"
                                            style={{ padding: '0.5rem', borderRadius: '50%' }}
                                            onClick={() => handleDelete(driver.id)}
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                                {drivers.length === 0 && (
                                    <p style={{ textAlign: 'center', color: 'var(--secondary)' }}>No hay conductores registrados.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
