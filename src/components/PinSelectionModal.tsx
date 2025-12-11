import { useState, useEffect, useRef } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { AlertCircle, MapPin, CheckCircle } from 'lucide-react';

interface PinSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (location: { address: string; lat: number; lng: number }) => void;
    initialLocation: { address: string; lat: number; lng: number } | null;
}

export default function PinSelectionModal({ isOpen, onClose, onConfirm, initialLocation }: PinSelectionModalProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
    const [markerInstance, setMarkerInstance] = useState<google.maps.Marker | null>(null);

    const [markerPosition, setMarkerPosition] = useState<{ lat: number, lng: number } | null>(null);
    const [isValid, setIsValid] = useState(true);
    const [distance, setDistance] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');
    const [currentAddress, setCurrentAddress] = useState('');

    const mapsLib = useMapsLibrary('maps');
    const geometryLib = useMapsLibrary('geometry');
    const geocodingLib = useMapsLibrary('geocoding');
    const markerLib = useMapsLibrary('marker'); // Might be needed for legacy marker if not globally available

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

    // Initialize Map Manually
    useEffect(() => {
        if (isOpen && mapsLib && mapRef.current && !mapInstance) {
            const map = new mapsLib.Map(mapRef.current, {
                center: initialLocation || { lat: 19.4326, lng: -99.1332 },
                zoom: 18,
                mapId: 'QUOTE_MAP', // Using same ID as main map for consistency
                disableDefaultUI: false,
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
                gestureHandling: 'greedy'
            });
            setMapInstance(map);
        }
    }, [isOpen, mapsLib, mapInstance, initialLocation]);

    // Initialize/Update Marker Manually
    useEffect(() => {
        if (!mapInstance || !initialLocation || !markerLib) return;

        // If marker doesn't exist, create it
        if (!markerInstance) {
            const marker = new google.maps.Marker({
                position: initialLocation,
                map: mapInstance,
                draggable: true,
                icon: {
                    url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                }
            });

            // Add Drag Listener
            marker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
                if (!e.latLng || !initialLocation || !geometryLib) return;

                const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                const initialLatLng = new google.maps.LatLng(initialLocation.lat, initialLocation.lng);
                const newLatLng = new google.maps.LatLng(newPos.lat, newPos.lng);

                // Use spherical geometry if available, else simple check (though geometryLib should be loaded)
                let dist = 0;
                if (geometryLib) {
                    dist = geometryLib.spherical.computeDistanceBetween(initialLatLng, newLatLng);
                }

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
            });

            setMarkerInstance(marker);
        } else {
            // Update existing marker position if initialLocation changes (e.g. reopening modal with new loc)
            // Actually, we usually want to reset to initialLocation on open.
            markerInstance.setPosition(initialLocation);
            mapInstance.setCenter(initialLocation);
        }

    }, [mapInstance, initialLocation, markerLib, geometryLib, geocoder]);


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
                    <div
                        ref={mapRef}
                        id="manual-map-container"
                        className="w-full h-full"
                    />

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
