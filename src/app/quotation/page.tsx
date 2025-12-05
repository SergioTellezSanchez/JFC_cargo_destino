'use client';

import { useState } from 'react';

export default function QuotationPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [formData, setFormData] = useState({
        origin: '',
        destination: '',
        packageType: 'BULTO',
        isLTL: 'true', // string for select
        vehicleType: '',
        volume: '',
        weight: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Client-side mock calculation
            const distanceKm = Math.floor(Math.random() * 490) + 10;
            const baseRatePerKm = 10;
            const weightFactor = 0.5;
            const volumeFactor = 100;

            let price = distanceKm * baseRatePerKm;
            if (formData.weight) price += Number(formData.weight) * weightFactor;
            if (formData.volume) price += Number(formData.volume) * volumeFactor;

            if (formData.isLTL === 'false') {
                price *= 1.5; // FTL Premium
            } else {
                price *= 0.8; // LTL Discount
            }

            setResult({
                price: Math.round(price * 100) / 100,
                details: `Distance: ${distanceKm} km. Type: ${formData.isLTL === 'true' ? 'LTL' : 'FTL'}.`,
                distanceKm
            });
        } catch (error) {
            console.error(error);
            alert('Error calculating quotation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem', fontWeight: 'bold' }}>Get a Quote</h1>

            <div className="responsive-grid" style={{ alignItems: 'flex-start' }}>
                <div className="card" style={{ flex: 1, minWidth: '300px' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Origin</label>
                            <input
                                type="text"
                                className="input"
                                required
                                value={formData.origin}
                                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                                placeholder="City or Zip Code"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Destination</label>
                            <input
                                type="text"
                                className="input"
                                required
                                value={formData.destination}
                                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                placeholder="City or Zip Code"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Package Type</label>
                                <select
                                    className="input"
                                    value={formData.packageType}
                                    onChange={(e) => setFormData({ ...formData, packageType: e.target.value })}
                                >
                                    <option value="BULTO">Bulto</option>
                                    <option value="PALLET">Pallet</option>
                                    <option value="CAJA">Caja</option>
                                    <option value="PZA">Pieza</option>
                                    <option value="BOTE">Bote</option>
                                    <option value="MUEBLE">Mueble</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Service Type</label>
                                <select
                                    className="input"
                                    value={formData.isLTL}
                                    onChange={(e) => setFormData({ ...formData, isLTL: e.target.value })}
                                >
                                    <option value="true">LTL (Shared)</option>
                                    <option value="false">FTL (Full Truck)</option>
                                </select>
                            </div>
                        </div>

                        {formData.isLTL === 'false' && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Vehicle Type</label>
                                <select
                                    className="input"
                                    required
                                    value={formData.vehicleType}
                                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                                >
                                    <option value="">Select Vehicle</option>
                                    <option value="CAMIONETA_CERRADA">Camioneta Cerrada</option>
                                    <option value="REDILAS">Redilas</option>
                                    <option value="CERRADA">Cerrada</option>
                                </select>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Volume (m³)</label>
                                <input
                                    type="number"
                                    className="input"
                                    step="0.1"
                                    value={formData.volume}
                                    onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Weight (kg)</label>
                                <input
                                    type="number"
                                    className="input"
                                    step="0.1"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
                            {loading ? 'Calculating...' : 'Get Quote'}
                        </button>
                    </form>
                </div>

                {result && (
                    <div className="card" style={{ flex: 1, minWidth: '300px', background: 'var(--primary-light)', borderColor: 'var(--primary)' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>Estimated Cost</h2>
                        <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                            ${result.price.toLocaleString()}
                        </div>
                        <p style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>{result.details}</p>
                        <div style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>
                            * This is an estimate. Final price may vary based on actual conditions and availability.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
