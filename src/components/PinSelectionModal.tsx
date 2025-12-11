import { useState, useEffect, useRef, useMemo } from 'react';
import { Map, Marker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
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
    // const map = useMap(); // Unused
    const geometryLib = useMapsLibrary('geometry');
    const geocodingLib = useMapsLibrary('geocoding');
    const [errorMsg, setErrorMsg] = useState('');
    const [currentAddress, setCurrentAddress] = useState('');
    const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);

    useEffect(() => {
        if (geocodingLib) {
            setGeocoder(new geocodingLib.Geocoder());
        }
    }, [geocodingLib]);

    useEffect(() => {
        if (isOpen && initialLocation) {
            setMarkerPosition({ lat: initialLocation.lat, lng: initialLocation.lng });
            setCurrentAddress(initialLocation.address);
            setIsValid(true);
            setDistance(0);
            setErrorMsg('');
        }
    }, [isOpen, initialLocation]);

    useEffect(() => {
        if (isOpen && initialLocation) {
            setMarkerPosition({ lat: initialLocation.lat, lng: initialLocation.lng });
            setCurrentAddress(initialLocation.address);
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

            // Reverse Geocode
            if (geocoder) {
                geocoder.geocode({ location: newPos }, (results, status) => {
                    if (status === 'OK' && results && results[0]) {
                        setCurrentAddress(results[0].formatted_address);
                    }
                });
            }
        }
    };

    const handleConfirm = () => {
        if (!markerPosition || !isValid || !initialLocation) return;

        onConfirm({
            address: currentAddress || initialLocation.address,
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
                        <p className="text-sm text-slate-500 max-w-full truncate">
                            {currentAddress || "Cargando dirección..."}
                        </p>
                    </div>
                </div>

                {/* Map Container */}
                <div className="relative flex-1 min-h-[400px] h-[500px]">
                    <Map
                        center={initialLocation}
                        zoom={18}
                        mapId="QUOTE_MAP"
                        id="pin-modal-map"
                        style={{ width: '100%', height: '100%' }}
                        disableDefaultUI={false}
                        zoomControl={true}
                    >
                        {markerPosition && (
                            <Marker
                                position={markerPosition}
                                draggable={true}
                                onDragEnd={handleDragEnd}
                                icon={{
                                    url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                                }}
                            />
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
