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
    const [markerPosition, setMarkerPosition] = useState<{ lat: number, lng: number } | null>(null);
    const [isValid, setIsValid] = useState(true);
    const [distance, setDistance] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');
    const [currentAddress, setCurrentAddress] = useState('');

    const geometryLib = useMapsLibrary('geometry');
    const geocodingLib = useMapsLibrary('geocoding');
    const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);

    // Initialize Geocoder
    useEffect(() => {
        if (geocodingLib) {
            setGeocoder(new geocodingLib.Geocoder());
        }
    }, [geocodingLib]);

    // Reset state when opening
    useEffect(() => {
        if (isOpen && initialLocation) {
            setMarkerPosition({ lat: initialLocation.lat, lng: initialLocation.lng });
            setCurrentAddress(initialLocation.address);
            setIsValid(true);
            setDistance(0);
            setErrorMsg('');
        }
    }, [isOpen, initialLocation]);

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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
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
                <div className="relative w-full h-[500px] bg-slate-100">
                    <Map
                        key={isOpen ? "map-open" : "map-closed"}
                        center={initialLocation}
                        zoom={18}
                        mapId="4b2094d4b3b1a5ccd5a74cb9"
                        style={{ width: '100%', height: '500px' }}
                        disableDefaultUI={false}
                        zoomControl={true}
                        gestureHandling={'greedy'}
                        reuseMaps={true}
                    >
                        <Marker
                            position={markerPosition || initialLocation}
                            draggable={true}
                            onDragEnd={(e) => {
                                if (!e.latLng || !initialLocation || !geometryLib) return;
                                const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                                const initialLatLng = new google.maps.LatLng(initialLocation.lat, initialLocation.lng);
                                const newLatLng = new google.maps.LatLng(newPos.lat, newPos.lng);

                                let dist = 0;
                                if (geometryLib) {
                                    dist = geometryLib.spherical.computeDistanceBetween(initialLatLng, newLatLng);
                                }

                                setDistance(dist);
                                setMarkerPosition(newPos);

                                if (dist > 100) {
                                    setIsValid(false);
                                    setErrorMsg(`El pin está a ${Math.round(dist)}m (máximo 100m)`);
                                } else {
                                    setIsValid(true);
                                    setErrorMsg('');
                                    if (geocoder) {
                                        geocoder.geocode({ location: newPos }, (results, status) => {
                                            if (status === 'OK' && results?.[0]) {
                                                setCurrentAddress(results[0].formatted_address);
                                            }
                                        });
                                    }
                                }
                            }}
                            icon={{
                                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                            }}
                        />
                    </Map>

                    {/* Error Overlay */}
                    {!isValid && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold animate-pulse z-10">
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
