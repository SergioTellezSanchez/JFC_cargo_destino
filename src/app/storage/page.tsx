'use client';

import { useState, useEffect } from 'react';
import { getStorageLocations, createStorageLocation } from '@/app/actions/storage';

export default function StoragePage() {
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        location: '',
        capacity: ''
    });

    useEffect(() => {
        loadLocations();
    }, []);

    const loadLocations = async () => {
        setLoading(true);
        try {
            const data = await getStorageLocations();
            setLocations(data);
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
            loadLocations();
        } catch (error) {
            console.error(error);
            alert('Error creating storage location');
        }
    };

    return (
        <div className="container">
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem', fontWeight: 'bold' }}>Temporary Storage</h1>

            <div className="responsive-grid" style={{ alignItems: 'flex-start' }}>
                <div className="card" style={{ flex: 1, minWidth: '300px' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '600' }}>Add Storage Location</h2>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Location Name</label>
                            <input
                                type="text"
                                className="input"
                                required
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g., Warehouse A"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Capacity (Units)</label>
                            <input
                                type="number"
                                className="input"
                                required
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">Add Location</button>
                    </form>
                </div>

                <div style={{ flex: 2, minWidth: '300px' }}>
                    <div className="card">
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '600' }}>Storage Locations</h2>
                        {loading ? (
                            <p>Loading...</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {locations.map((loc) => (
                                    <div key={loc.id} style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{loc.location}</h3>
                                            <span className="badge badge-assigned">
                                                {loc.currentLoad} / {loc.capacity} Units
                                            </span>
                                        </div>
                                        <div style={{ background: 'var(--secondary-bg)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                                            <div
                                                style={{
                                                    width: `${Math.min((loc.currentLoad / loc.capacity) * 100, 100)}%`,
                                                    background: 'var(--primary)',
                                                    height: '100%'
                                                }}
                                            />
                                        </div>
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--secondary)' }}>
                                            {loc.packages && loc.packages.length > 0 ? (
                                                <span>Stored Packages: {loc.packages.length}</span>
                                            ) : (
                                                <span>No packages stored</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {locations.length === 0 && (
                                    <p style={{ color: 'var(--secondary)', textAlign: 'center' }}>No storage locations found</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
