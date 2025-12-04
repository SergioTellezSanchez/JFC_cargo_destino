'use client';

import { useState, useEffect } from 'react';
import { getVehicles, createVehicle, deleteVehicle } from '@/app/actions/vehicles';

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
            alert('Error creating vehicle');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure?')) {
            await deleteVehicle(id);
            loadVehicles();
        }
    };

    return (
        <div className="container">
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem', fontWeight: 'bold' }}>Vehicle Management</h1>

            <div className="responsive-grid" style={{ alignItems: 'flex-start' }}>
                <div className="card" style={{ flex: 1, minWidth: '300px' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '600' }}>Add New Vehicle</h2>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <input
                                type="text"
                                className="input"
                                placeholder="Make"
                                required
                                value={formData.make}
                                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                            />
                            <input
                                type="text"
                                className="input"
                                placeholder="Model"
                                required
                                value={formData.model}
                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <input
                                type="number"
                                className="input"
                                placeholder="Year"
                                required
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                            />
                            <input
                                type="text"
                                className="input"
                                placeholder="License Plate"
                                required
                                value={formData.plate}
                                onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <input
                                type="number"
                                className="input"
                                placeholder="Volume Capacity (m³)"
                                step="0.1"
                                required
                                value={formData.capacityVolume}
                                onChange={(e) => setFormData({ ...formData, capacityVolume: e.target.value })}
                            />
                            <input
                                type="number"
                                className="input"
                                placeholder="Weight Capacity (kg)"
                                step="0.1"
                                required
                                value={formData.capacityWeight}
                                onChange={(e) => setFormData({ ...formData, capacityWeight: e.target.value })}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <select
                                className="input"
                                value={formData.fuelType}
                                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                            >
                                <option value="GASOLINE">Gasoline</option>
                                <option value="DIESEL">Diesel</option>
                                <option value="ELECTRIC">Electric</option>
                                <option value="HYBRID">Hybrid</option>
                            </select>
                            <input
                                type="number"
                                className="input"
                                placeholder="Performance (km/l)"
                                step="0.1"
                                required
                                value={formData.fuelPerformance}
                                onChange={(e) => setFormData({ ...formData, fuelPerformance: e.target.value })}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <input
                                type="number"
                                className="input"
                                placeholder="Fuel Price ($/l)"
                                step="0.01"
                                required
                                value={formData.fuelPrice}
                                onChange={(e) => setFormData({ ...formData, fuelPrice: e.target.value })}
                            />
                            <input
                                type="number"
                                className="input"
                                placeholder="Market Value ($)"
                                required
                                value={formData.marketValue}
                                onChange={(e) => setFormData({ ...formData, marketValue: e.target.value })}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary">Add Vehicle</button>
                    </form>
                </div>

                <div style={{ flex: 2, minWidth: '300px' }}>
                    <div className="card">
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '600' }}>Fleet List</h2>
                        {loading ? (
                            <p>Loading...</p>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Vehicle</th>
                                            <th>Plate</th>
                                            <th>Capacity</th>
                                            <th>Performance</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vehicles.map((vehicle) => (
                                            <tr key={vehicle.id}>
                                                <td>{vehicle.year} {vehicle.make} {vehicle.model}</td>
                                                <td>{vehicle.plate}</td>
                                                <td>{vehicle.capacityWeight}kg / {vehicle.capacityVolume}m³</td>
                                                <td>{vehicle.fuelPerformance} km/l</td>
                                                <td>
                                                    <button
                                                        className="btn btn-danger"
                                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                                        onClick={() => handleDelete(vehicle.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {vehicles.length === 0 && (
                                            <tr>
                                                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--secondary)' }}>No vehicles found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
