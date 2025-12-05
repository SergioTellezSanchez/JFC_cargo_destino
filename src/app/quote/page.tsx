'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
    const [breakdown, setBreakdown] = useState<{
        base: number;
        weightCost: number;
        volumeCost: number;
        distanceCost: number;
        total: number;
    } | null>(null);

    const router = useRouter();

    const calculateQuote = (e: React.FormEvent) => {
        e.preventDefault();

        const base = 50;
        const weightCost = Number(formData.weight) * 10;
        const volume = (Number(formData.length) * Number(formData.width) * Number(formData.height)) / 5000;
        const volumeCost = volume * 500; // Adjusted for realism
        const distanceCost = 150;

        const total = base + Math.max(weightCost, volumeCost) + distanceCost;

        setBreakdown({
            base,
            weightCost,
            volumeCost,
            distanceCost,
            total: Math.round(total * 100) / 100
        });
    };

    const handleContinue = () => {
        router.push('/admin?tab=packages&modal=create');
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
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ flex: '1 1 300px' }}>
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
                        <div style={{ flex: '1 1 300px' }}>
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
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ flex: '1 1 200px' }}>
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
                            <div style={{ flex: '1 1 200px' }}>
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
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ flex: '1 1 150px' }}>
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
                            <div style={{ flex: '1 1 150px' }}>
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
                            <div style={{ flex: '1 1 150px' }}>
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

                {breakdown && (
                    <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--secondary-bg)', borderRadius: '0.5rem', border: '1px solid var(--accent)' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center', color: 'var(--primary)' }}>
                            Desglose de Costos
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Tarifa Base:</span>
                                <span>${breakdown.base.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Costo por Peso:</span>
                                <span>${breakdown.weightCost.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Costo Volumétrico:</span>
                                <span>${breakdown.volumeCost.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Distancia (Est.):</span>
                                <span>${breakdown.distanceCost.toFixed(2)}</span>
                            </div>
                            <div style={{ borderTop: '1px solid var(--border)', margin: '0.5rem 0' }}></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                <span>Total Estimado:</span>
                                <span style={{ color: 'var(--success)' }}>${breakdown.total.toFixed(2)} MXN</span>
                            </div>
                        </div>

                        <p style={{ textAlign: 'center', color: 'var(--secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                            *El precio final puede variar según condiciones específicas.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                            <button
                                className="btn btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                onClick={handleContinue}
                            >
                                Continuar con el Envío <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
