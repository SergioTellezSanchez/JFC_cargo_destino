import { useState, useEffect, useRef } from 'react';
import { Map, Marker, useMapsLibrary } from '@vis.gl/react-google-maps';
import { AlertCircle, MapPin, CheckCircle } from 'lucide-react';

interface PinSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (location: { address: string; lat: number; lng: number }) => void;
    initialLocation: { address: string; lat: number; lng: number } | null;
}

export default function PinSelectionModal({ isOpen, onClose, onConfirm, initialLocation }: PinSelectionModalProps) {

    const handleConfirm = () => {
        onConfirm(initialLocation || { address: '', lat: 0, lng: 0 });
        onClose();
    };

    if (!isOpen || !initialLocation) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <MapPin className="text-blue-600" size={24} />
                            DEBUG MODE: Solo Mapa
                        </h3>
                    </div>
                </div>

                {/* Map Container */}
                <div className="relative flex-1 min-h-[400px] h-[500px] bg-slate-100">
                    <Map
                        center={initialLocation}
                        zoom={18}
                        mapId="4b2094d4b3b1a5ccd5a74cb9"
                        style={{ width: '100%', height: '100%' }}
                        disableDefaultUI={false}
                        zoomControl={true}
                        gestureHandling={'greedy'}
                        reuseMaps={true}
                    />
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 z-10">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-white hover:text-slate-700 transition-colors"
                    >
                        Cerrar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-8 py-3 rounded-xl font-bold bg-slate-900 text-white shadow-lg"
                    >
                        Confirmar (Test)
                    </button>
                </div>
            </div>
        </div>
    );
}
