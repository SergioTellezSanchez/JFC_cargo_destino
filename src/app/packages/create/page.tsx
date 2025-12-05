'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatePackagePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<{ vehicles: any[], drivers: any[] }>({ vehicles: [], drivers: [] });
    const [backhaulAvailable, setBackhaulAvailable] = useState(false);

    const [formData, setFormData] = useState({
        recipientName: '',
        address: '',
        postalCode: '',
        weight: '',
        size: 'MEDIUM',
        instructions: '',
        leaveWithSecurity: 'false',
        declaredValue: '',
        insurance: 'false',
        vehicleId: '',
        driverId: '',
        photos: [] as string[],
        isBackhaul: 'false'
    });

    const [photoInput, setPhotoInput] = useState('');

    useEffect(() => {
        const init = async () => {
            const [vehiclesRes, driversRes] = await Promise.all([
                fetch('/api/vehicles'),
                fetch('/api/drivers')
            ]);
            const vehicles = await vehiclesRes.json();
            const drivers = await driversRes.json();
            setData({ vehicles, drivers });
        };
        init();
    }, []);

    const handleAddressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setFormData({ ...formData, address: val });
        // Mock backhaul check
        if (val.length > 3) {
            setBackhaulAvailable(Math.random() > 0.7);
        }
    };

    const addPhoto = () => {
        if (photoInput && formData.photos.length < 6) {
            setFormData({ ...formData, photos: [...formData.photos, photoInput] });
            setPhotoInput('');
        }
    };

    const removePhoto = (index: number) => {
        const newPhotos = [...formData.photos];
        newPhotos.splice(index, 1);
        setFormData({ ...formData, photos: newPhotos });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await fetch('/api/packages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            router.push('/admin'); // Redirect to admin or list
        } catch (error) {
            console.error(error);
            alert('Error creating package');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem', fontWeight: 'bold' }}>Create New Package</h1>

            <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Section 1: Package Details */}
                    <div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Package Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Recipient Name</label>
                                <input className="input" required value={formData.recipientName} onChange={e => setFormData({ ...formData, recipientName: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Postal Code</label>
                                <input className="input" required value={formData.postalCode} onChange={e => setFormData({ ...formData, postalCode: e.target.value })} />
                            </div>
                        </div>
                        <div style={{ marginTop: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Address</label>
                            <input className="input" required value={formData.address} onChange={handleAddressChange} />
                            {backhaulAvailable && (
                                <div className="badge badge-assigned" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                                    <span style={{ marginRight: '0.5rem' }}>✨</span> Backhaul Opportunity Available! (Return Trip)
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 2: Characteristics */}
                    <div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Characteristics</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Weight (kg)</label>
                                <input type="number" className="input" required value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Size</label>
                                <select className="input" value={formData.size} onChange={e => setFormData({ ...formData, size: e.target.value })}>
                                    <option value="SMALL">Small</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="LARGE">Large</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Declared Value ($)</label>
                                <input type="number" className="input" required value={formData.declaredValue} onChange={e => setFormData({ ...formData, declaredValue: e.target.value })} />
                            </div>
                        </div>
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '2rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="checkbox" checked={formData.insurance === 'true'} onChange={e => setFormData({ ...formData, insurance: e.target.checked ? 'true' : 'false' })} />
                                Add Insurance
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="checkbox" checked={formData.leaveWithSecurity === 'true'} onChange={e => setFormData({ ...formData, leaveWithSecurity: e.target.checked ? 'true' : 'false' })} />
                                Leave with Security
                            </label>
                            {backhaulAvailable && (
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                                    <input type="checkbox" checked={formData.isBackhaul === 'true'} onChange={e => setFormData({ ...formData, isBackhaul: e.target.checked ? 'true' : 'false' })} />
                                    Use Backhaul (Discounted)
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Section 3: Photos */}
                    <div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Photos (Max 6)</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <input
                                className="input"
                                placeholder="Image URL"
                                value={photoInput}
                                onChange={e => setPhotoInput(e.target.value)}
                                disabled={formData.photos.length >= 6}
                            />
                            <button type="button" className="btn btn-secondary" onClick={addPhoto} disabled={formData.photos.length >= 6}>Add</button>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {formData.photos.map((url, idx) => (
                                <div key={idx} style={{ position: 'relative', width: '100px', height: '100px', border: '1px solid var(--border)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                                    <img src={url} alt="Package" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button
                                        type="button"
                                        onClick={() => removePhoto(idx)}
                                        style={{ position: 'absolute', top: 0, right: 0, background: 'red', color: 'white', border: 'none', cursor: 'pointer', padding: '0.2rem 0.4rem' }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 4: Assignment */}
                    <div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Assignment</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Assign Driver</label>
                                <select className="input" value={formData.driverId} onChange={e => setFormData({ ...formData, driverId: e.target.value })}>
                                    <option value="">Select Driver</option>
                                    {data.drivers.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Preferred Vehicle</label>
                                <select className="input" value={formData.vehicleId} onChange={e => setFormData({ ...formData, vehicleId: e.target.value })}>
                                    <option value="">Select Vehicle</option>
                                    {data.vehicles.map(v => (
                                        <option key={v.id} value={v.id}>{v.make} {v.model} ({v.plate})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div style={{ background: 'var(--secondary-bg)', padding: '1rem', borderRadius: '0.5rem' }}>
                        <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Estimated Costs</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span>Advance Payment (Pickup):</span>
                            <span>$200.00</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span>Estimated Tolls:</span>
                            <span>$150.00 (Calculated)</span>
                        </div>
                        {formData.insurance === 'true' && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <span>Insurance Premium:</span>
                                <span>${(Number(formData.declaredValue) * 0.01).toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '1rem' }}>
                        {loading ? 'Creating...' : 'Create Package'}
                    </button>
                </form>
            </div>
        </div>
    );
}
