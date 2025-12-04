'use client';

import { useState } from 'react';
import { Calculator, MapPin, Package, DollarSign, ArrowRight } from 'lucide-react';

export default function QuotePage() {
    const [formData, setFormData] = useState({
        origin: '',
        destination: '',
        weight: '',
        length: '',
        width: '',
        height: '',
        type: 'BOX'
    });
    const [quote, setQuote] = useState<number | null>(null);

    const calculateQuote = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock calculation logic
        // Base price $50 + $10 per kg + $0.5 per cm3 (mock)
        const weightCost = Number(formData.weight) * 10;
        const volume = (Number(formData.length) * Number(formData.width) * Number(formData.height)) / 5000; // Volumetric weight
        const volumeCost = volume * 5;
        const distanceCost = 150; // Mock distance cost

        const total = 50 + Math.max(weightCost, volumeCost) + distanceCost;
        setQuote(Math.round(total * 100) / 100);
    };

    const isValid = Object.values(formData).every(value => value !== '');

    return (
        <div className="container" style={{ maxWidth: '800px', padding: '2rem' }}>
            <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '2rem', fontWeight: 'bold', textAlign: 'center' }}>
                Cotizar Envío
            </h1>

            <div className="card">
                <form onSubmit={calculateQuote} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Locations */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="text-sm font-medium text-gray-700" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={16} /> Origen
                            </label>
                            <input
                                type="text"
                                className="input"
                                placeholder="CP o Ciudad de Origen"
                                required
                                value={formData.origin}
                                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={16} /> Destino
                            </label>
                            <input
                                type="text"
                                className="input"
                                placeholder="CP o Ciudad de Destino"
                                required
                                value={formData.destination}
                                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Package Details */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Package size={20} /> Detalles del Paquete
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Peso (kg)</label>
                                <input
                                    type="number"
                                    className="input"
                                    placeholder="0.0"
                                    step="0.1"
                                    required
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Tipo</label>
                                <select
                                    className="input"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="BOX">Caja</option>
                                    <option value="PALLET">Pallet</option>
                                    <option value="ENVELOPE">Sobre</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Largo (cm)</label>
                                <input
                                    type="number"
                                    className="input"
                                    placeholder="0"
                                    required
                                    value={formData.length}
                                    onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Ancho (cm)</label>
                                <input
                                    type="number"
                                    className="input"
                                    placeholder="0"
                                    required
                                    value={formData.width}
                                    onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Alto (cm)</label>
                                <input
                                    type="number"
                                    className="input"
                                    placeholder="0"
                                    required
                                    value={formData.height}
                                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn"
                        disabled={!isValid}
                        style={{
                            fontSize: '1.1rem',
                            padding: '1rem',
                            background: isValid ? 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' : 'var(--border)',
                            color: isValid ? 'white' : 'var(--secondary)',
                            cursor: isValid ? 'pointer' : 'not-allowed',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <Calculator size={20} /> Calcular Costo
                    </button>
                </form>

                {quote !== null && (
                    <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--secondary-bg)', borderRadius: '0.5rem', border: '1px solid var(--accent)' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center', color: 'var(--primary)' }}>
                            Costo Estimado
                        </h2>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                            <DollarSign size={32} /> {quote.toFixed(2)} MXN
                        </div>
                        <p style={{ textAlign: 'center', color: 'var(--secondary)', marginTop: '0.5rem' }}>
                            *El precio final puede variar según condiciones específicas.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Continuar con el Envío <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
