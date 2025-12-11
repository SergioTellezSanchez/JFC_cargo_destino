import { useState, useEffect, useRef, useMemo } from 'react';
import { Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { AlertCircle, MapPin, CheckCircle } from 'lucide-react';

interface PinSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (location: { address: string; lat: number; lng: number }) => void;
    initialLocation: { address: string; lat: number; lng: number } | null;
}

export default function PinSelectionModal({ isOpen, onClose, onConfirm, initialLocation }: PinSelectionModalProps) {
    const [markerPosition, setMarkerPosition] = useState<{ lat: number, lng: number } | null>(null);
    const [isValid, setIsValid] = useState(true);
    const [distance, setDistance] = useState(0);
    const map = useMap();
    const geometryLib = useMapsLibrary('geometry');
    const geocodingLib = useMapsLibrary('geocoding');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (isOpen && initialLocation) {
            setMarkerPosition({ lat: initialLocation.lat, lng: initialLocation.lng });
            setIsValid(true);
            setDistance(0);
            setErrorMsg('');
        }
    }, [isOpen, initialLocation]);

    // Validate distance when marker moves
    const handleDragEnd = (e: google.maps.MapMouseEvent) => {
        if (!e.latLng || !initialLocation || !geometryLib) return;

        const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        const initialLatLng = new google.maps.LatLng(initialLocation.lat, initialLocation.lng);
        const newLatLng = new google.maps.LatLng(newPos.lat, newPos.lng);

        const dist = geometryLib.spherical.computeDistanceBetween(initialLatLng, newLatLng);
        setDistance(dist);
        setMarkerPosition(newPos);

        if (dist > 50) {
            setIsValid(false);
            setErrorMsg(`El pin está a ${Math.round(dist)}m (máximo 50m)`);
        } else {
            setIsValid(true);
            setErrorMsg('');
        }
    };

    const handleConfirm = () => {
        if (!markerPosition || !isValid || !initialLocation) return;

        // Reverse geocode if position changed significantly? 
        // For now, we keep the original address string but update coordinates
        // Or we could trigger a reverse geocode here if we really wanted to be precise with the address text.
        // Given user requirement "user seeks address... then edits pin", usually we keep the main address text but refine the lat/long for the driver.

        onConfirm({
            address: initialLocation.address, // Keep original address text for consistency
            lat: markerPosition.lat,
            lng: markerPosition.lng
        });
        onClose();
    };

    if (!isOpen || !initialLocation) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <MapPin className="text-blue-600" size={24} />
                            Confirma la ubicación exacta
                        </h3>
                        <p className="text-sm text-slate-500">Mueve el pin si es necesario (máximo 50m).</p>
                    </div>
                </div>

                {/* Map Container */}
                <div className="relative flex-1 min-h-[400px]">
                    <Map
                        defaultCenter={initialLocation}
                        defaultZoom={18}
                        mapId="PIN_SELECTION_MAP"
                        style={{ width: '100%', height: '100%' }}
                        disableDefaultUI={false}
                        gestureHandling={'greedy'}
                    >
                        {markerPosition && (
                            <AdvancedMarker
                                position={markerPosition}
                                draggable={true}
                                onDragEnd={handleDragEnd}
                            >
                                <div className={`relative -translate-y-full hover:scale-110 transition-transform`}>
                                    <MapPin
                                        size={40}
                                        className={`drop-shadow-lg ${isValid ? 'text-blue-600 fill-blue-100' : 'text-red-500 fill-red-100'}`}
                                    />
                                    {!isValid && (
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm whitespace-nowrap">
                                            Fuera de rango
                                        </div>
                                    )}
                                </div>
                            </AdvancedMarker>
                        )}

                        {/* Circle to show 50m radius (Visual Hint) */}
                        {/* Note: React Google Maps doesn't have a simple Circle component in the main export without custom implementation or raw API usage. 
                             We can skip visual circle for MVP or add it if complex. 
                             Validating Logic is sufficient.
                         */}
                    </Map>

                    {/* Error Overlay */}
                    {!isValid && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold animate-pulse">
                            <AlertCircle size={16} />
                            {errorMsg}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 z-10">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-white hover:text-slate-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!isValid}
                        className={`px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all
                            ${isValid
                                ? 'bg-slate-900 text-white hover:bg-slate-800 hover:-translate-y-1'
                                : 'bg-slate-300 text-slate-500 cursor-not-allowed'}
                        `}
                    >
                        <CheckCircle size={18} />
                        Confirmar Ubicación
                    </button>
                </div>
            </div>
        </div>
    );
}
