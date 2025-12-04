'use client';

import { useState, useEffect } from 'react';
import { getVehicles, createVehicle, deleteVehicle } from '@/app/actions/vehicles';
import { Truck, Trash2, Plus, Fuel } from 'lucide-react';

export default function VehiclesPage() {
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        plate: '',
        capacityVolume: '',
        capacityWeight: '',
        fuelType: 'GASOLINE',
        fuelPerformance: '',
        fuelPrice: '',
        marketValue: '',
        usefulLifeDays: 1825 // 5 years
    });

    useEffect(() => {
        loadVehicles();
    }, []);

    const loadVehicles = async () => {
        setLoading(true);
        try {
            const data = await getVehicles();
            setVehicles(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createVehicle(formData);
            setFormData({
                make: '',
                model: '',
                year: new Date().getFullYear(),
                plate: '',
                capacityVolume: '',
                capacityWeight: '',
                fuelType: 'GASOLINE',
                fuelPerformance: '',
                fuelPrice: '',
                marketValue: '',
                usefulLifeDays: 1825
            });
            loadVehicles();
        } catch (error) {
            console.error(error);
            alert('Error al crear vehículo');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este vehículo?')) {
            await deleteVehicle(id);
            loadVehicles();
        }
    };

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '2rem', fontWeight: 'bold' }}>Gestión de Flota</h1>

            <div className="responsive-grid" style={{ alignItems: 'flex-start', gap: '2rem' }}>
                {/* Add Vehicle Form */}
                <div className="card" style={{ flex: 1, minWidth: '300px' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={20} /> Agregar Vehículo
                    </h2>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Marca</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Ej. Nissan"
                                    required
                                    value={formData.make}
                                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Modelo</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Ej. NP300"
                                    required
                                    value={formData.model}
                                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Año</label>
                                <input
                                    type="number"
                                    className="input"
                                    placeholder="2024"
                                    required
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Placa</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="ABC-123"
                                    required
                                    value={formData.plate}
                                    onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Capacidad Vol (m³)</label>
                                <input
                                    type="number"
                                    className="input"
                                    step="0.1"
                                    required
                                    value={formData.capacityVolume}
                                    onChange={(e) => setFormData({ ...formData, capacityVolume: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Capacidad Peso (kg)</label>
                                <input
                                    type="number"
                                    className="input"
                                    step="0.1"
                                    required
                                    value={formData.capacityWeight}
                                    onChange={(e) => setFormData({ ...formData, capacityWeight: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Combustible</label>
                                <select
                                    className="input"
                                    value={formData.fuelType}
                                    onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                                >
                                    <option value="GASOLINE">Gasolina</option>
                                    <option value="DIESEL">Diesel</option>
                                    <option value="ELECTRIC">Eléctrico</option>
                                    <option value="HYBRID">Híbrido</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Rendimiento (km/l)</label>
                                <input
                                    type="number"
                                    className="input"
                                    step="0.1"
                                    required
                                    value={formData.fuelPerformance}
                                    onChange={(e) => setFormData({ ...formData, fuelPerformance: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Precio Combustible ($/l)</label>
                                <input
                                    type="number"
                                    className="input"
                                    step="0.01"
                                    required
                                    value={formData.fuelPrice}
                                    onChange={(e) => setFormData({ ...formData, fuelPrice: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Valor Mercado ($)</label>
                                <input
                                    type="number"
                                    className="input"
                                    required
                                    value={formData.marketValue}
                                    onChange={(e) => setFormData({ ...formData, marketValue: e.target.value })}
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                            <Plus size={18} /> Registrar Vehículo
                        </button>
                    </form>
                </div>

                {/* Vehicle List */}
                <div style={{ flex: 2, minWidth: '300px' }}>
                    <div className="card">
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Truck size={24} /> Flota Activa
                        </h2>
                        {loading ? (
                            <p>Cargando...</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {vehicles.map((vehicle) => (
                                    <div key={vehicle.id} className="card" style={{ border: '1px solid var(--border)', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>
                                                {vehicle.make} {vehicle.model} <span style={{ color: 'var(--secondary)', fontWeight: 'normal' }}>({vehicle.year})</span>
                                            </h3>
                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--secondary)' }}>
                                                <span className="badge badge-assigned">{vehicle.plate}</span>
                                                <span>{vehicle.capacityWeight}kg / {vehicle.capacityVolume}m³</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Fuel size={14} /> {vehicle.fuelType}</span>
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-danger"
                                            style={{ padding: '0.5rem', borderRadius: '50%' }}
                                            onClick={() => handleDelete(vehicle.id)}
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                                {vehicles.length === 0 && (
                                    <p style={{ textAlign: 'center', color: 'var(--secondary)' }}>No hay vehículos registrados.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
