'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calculator, MapPin, Package, DollarSign, ArrowRight, CheckCircle, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Modal from '@/components/Modal';
import { useLanguage } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { useUser } from '@/lib/UserContext';

export default function QuotePage() {
    const { language } = useLanguage();
    const t = useTranslation(language);
    const router = useRouter();

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

    // Modal & Receipt State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [shippingDetails, setShippingDetails] = useState({
        senderName: '',
        senderPhone: '',
        receiverName: '',
        receiverPhone: '',
        notes: ''
    });

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
        setIsModalOpen(true);
    };

    const { user } = useUser();

    const handleCreatePackage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!breakdown) return;

        try {
            const trackingId = 'TRK-' + Math.random().toString(36).substr(2, 9).toUpperCase();

            const response = await fetch('/api/packages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    trackingId,
                    recipientName: shippingDetails.receiverName,
                    address: formData.destination, // Mapping destination to address
                    postalCode: formData.destination, // Mapping destination to postalCode (simplification)
                    weight: formData.weight,
                    size: `${formData.length}x${formData.width}x${formData.height} cm`,
                    instructions: shippingDetails.notes,
                    createdBy: user?.uid,

                    // Enhanced fields
                    origin: formData.origin,
                    destination: formData.destination,
                    senderName: shippingDetails.senderName,
                    senderPhone: shippingDetails.senderPhone,
                    receiverPhone: shippingDetails.receiverPhone,
                    type: formData.type,
                    cost: breakdown.total
                }),
            });

            if (response.ok) {
                setIsModalOpen(false);
                setIsReceiptOpen(true);
            } else {
                alert('Error creating package. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred.');
        }
    };

    const isShippingValid = Object.values(shippingDetails).every(val => val !== '') && shippingDetails.senderPhone.length >= 10;

    const isValid = Object.values(formData).every(value => value !== '');

    return (
        <div className="container" style={{ maxWidth: '800px', padding: '2rem' }}>
            <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '2rem', fontWeight: 'bold', textAlign: 'center' }}>
                {t('quoteTitle')}
            </h1>

            <div className="card">
                <form onSubmit={calculateQuote} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Locations */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ flex: '1 1 300px' }}>
                            <label className="text-sm font-medium text-gray-700" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={16} /> {t('origin')}
                            </label>
                            <input
                                type="text"
                                className="input"
                                placeholder={language === 'es' ? "CP o Ciudad de Origen" : "Zip or Origin City"}
                                required
                                value={formData.origin}
                                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                            />
                        </div>
                        <div style={{ flex: '1 1 300px' }}>
                            <label className="text-sm font-medium text-gray-700" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={16} /> {language === 'es' ? "Destino" : "Destination"}
                            </label>
                            <input
                                type="text"
                                className="input"
                                placeholder={language === 'es' ? "CP o Ciudad de Destino" : "Zip or Destination City"}
                                required
                                value={formData.destination}
                                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Package Details */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Package size={20} /> {t('packageDetails')}
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ flex: '1 1 200px' }}>
                                <label className="text-sm font-medium text-gray-700">{t('weight')} (kg)</label>
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
                                <label className="text-sm font-medium text-gray-700">{language === 'es' ? "Tipo" : "Type"}</label>
                                <select
                                    className="input"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="BOX">{language === 'es' ? "Caja" : "Box"}</option>
                                    <option value="PALLET">Pallet</option>
                                    <option value="ENVELOPE">{language === 'es' ? "Sobre" : "Envelope"}</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ flex: '1 1 150px' }}>
                                <label className="text-sm font-medium text-gray-700">{t('length')} (cm)</label>
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
                                <label className="text-sm font-medium text-gray-700">{t('width')} (cm)</label>
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
                                <label className="text-sm font-medium text-gray-700">{t('height')} (cm)</label>
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
                        <Calculator size={20} /> {t('calculate')}
                    </button>
                </form>

                {breakdown && (
                    <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--secondary-bg)', borderRadius: '0.5rem', border: '1px solid var(--accent)' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center', color: 'var(--primary)' }}>
                            {t('costBreakdown')}
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{t('baseRate')}:</span>
                                <span>{formatCurrency(breakdown.base)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{t('weightCost')}:</span>
                                <span>{formatCurrency(breakdown.weightCost)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{t('volumeCost')}:</span>
                                <span>{formatCurrency(breakdown.volumeCost)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{t('distanceCost')}:</span>
                                <span>{formatCurrency(breakdown.distanceCost)}</span>
                            </div>
                            <div style={{ borderTop: '1px solid var(--border)', margin: '0.5rem 0' }}></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                <span>{t('totalEstimated')}:</span>
                                <span style={{ whiteSpace: 'nowrap' }}>{formatCurrency(breakdown.total)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleContinue}
                            className="btn"
                            style={{
                                width: '100%',
                                background: 'var(--accent)',
                                color: 'white',
                                padding: '1rem',
                                fontSize: '1.1rem',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            {t('continueShipping')} <ArrowRight size={20} />
                        </button>
                    </div>
                )}
            </div>

            {/* Modal for Shipping Details */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={language === 'es' ? "Completar Envío" : "Complete Shipping"}
            >
                <form onSubmit={handleCreatePackage} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <h3 className="font-bold mb-2">{language === 'es' ? "Remitente" : "Sender"}</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                className="input"
                                placeholder={language === 'es' ? "Nombre Completo" : "Full Name"}
                                required
                                value={shippingDetails.senderName}
                                onChange={e => setShippingDetails({ ...shippingDetails, senderName: e.target.value })}
                            />
                            <input
                                className="input"
                                placeholder={language === 'es' ? "Teléfono" : "Phone"}
                                required
                                value={shippingDetails.senderPhone}
                                onChange={e => setShippingDetails({ ...shippingDetails, senderPhone: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold mb-2">{language === 'es' ? "Destinatario" : "Recipient"}</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                className="input"
                                placeholder={language === 'es' ? "Nombre Completo" : "Full Name"}
                                required
                                value={shippingDetails.receiverName}
                                onChange={e => setShippingDetails({ ...shippingDetails, receiverName: e.target.value })}
                            />
                            <input
                                className="input"
                                placeholder={language === 'es' ? "Teléfono" : "Phone"}
                                required
                                value={shippingDetails.receiverPhone}
                                onChange={e => setShippingDetails({ ...shippingDetails, receiverPhone: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium">{language === 'es' ? "Notas Adicionales" : "Additional Notes"}</label>
                        <textarea
                            className="input"
                            rows={2}
                            value={shippingDetails.notes}
                            onChange={e => setShippingDetails({ ...shippingDetails, notes: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn mt-4"
                        disabled={!isShippingValid}
                        style={{
                            background: isShippingValid ? 'var(--primary)' : 'var(--border)',
                            color: isShippingValid ? 'white' : 'var(--secondary)',
                            cursor: isShippingValid ? 'pointer' : 'not-allowed',
                            width: '100%',
                            padding: '1rem',
                            fontWeight: 'bold',
                            boxShadow: isShippingValid ? '0 4px 14px 0 rgba(0,118,255,0.39)' : 'none'
                        }}
                    >
                        {language === 'es' ? "Crear Paquete" : "Create Package"}
                    </button>
                </form>
            </Modal>

            {/* Receipt Overlay */}
            {isReceiptOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    backdropFilter: 'blur(5px)'
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '500px', padding: '2rem', position: 'relative', animation: 'fadeIn 0.3s ease' }}>
                        <button
                            onClick={() => {
                                setIsReceiptOpen(false);
                                router.push('/admin?tab=packages');
                            }}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{
                                width: '80px', height: '80px', background: 'var(--success)', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto',
                                color: 'white'
                            }}>
                                <CheckCircle size={48} />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{language === 'es' ? "¡Envío Creado!" : "Shipment Created!"}</h2>
                            <p style={{ color: 'var(--secondary)' }}>{language === 'es' ? "Tu paquete ha sido registrado exitosamente." : "Your package has been successfully registered."}</p>
                        </div>

                        <div style={{ background: 'var(--secondary-bg)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-500">{t('origin')}:</span>
                                <span className="font-medium">{formData.origin}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-500">{language === 'es' ? "Destino" : "Destination"}:</span>
                                <span className="font-medium">{formData.destination}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-500">{t('weight')}:</span>
                                <span className="font-medium">{formData.weight} kg</span>
                            </div>
                            <div className="border-t my-2"></div>
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total:</span>
                                <span>{breakdown ? formatCurrency(breakdown.total) : '$0.00'}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setIsReceiptOpen(false);
                                router.push('/admin?tab=packages');
                            }}
                            className="btn"
                            style={{ width: '100%', background: 'var(--primary)', color: 'white', padding: '1rem' }}
                        >
                            {language === 'es' ? "Ver en Mis Paquetes" : "View in My Packages"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
