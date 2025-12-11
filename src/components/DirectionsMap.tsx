import { useEffect, useState } from 'react';
import { Map, useMapsLibrary, useMap } from '@vis.gl/react-google-maps';

interface DirectionsMapProps {
    origin: { lat: number; lng: number } | null;
    destination: { lat: number; lng: number } | null;
    onDistanceCalculated?: (distanceKm: number) => void;
}

import { MapMouseEvent } from '@vis.gl/react-google-maps';

export default function DirectionsMap({ origin, destination, onDistanceCalculated, onMapClick }: DirectionsMapProps & { onMapClick?: (e: MapMouseEvent) => void }) {
    const map = useMap();
    const routesLibrary = useMapsLibrary('routes');
    const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

    // Initialize Service and Renderer
    useEffect(() => {
        if (!routesLibrary || !map) return;

        const service = new routesLibrary.DirectionsService();
        const renderer = new routesLibrary.DirectionsRenderer({
            map,
            suppressMarkers: false,
            polylineOptions: {
                strokeColor: '#1f4a5e',
                strokeWeight: 5
            }
        });

        setDirectionsService(service);
        setDirectionsRenderer(renderer);

        return () => {
            renderer.setMap(null);
        };
    }, [routesLibrary, map]);

    // Calculate Route
    useEffect(() => {
        if (!directionsService || !directionsRenderer || !origin || !destination) return;

        directionsService.route({
            origin,
            destination,
            travelMode: google.maps.TravelMode.DRIVING,
        }).then(response => {
            directionsRenderer.setDirections(response);

            if (response.routes[0] && response.routes[0].legs[0]) {
                const distanceMeters = response.routes[0].legs[0].distance?.value || 0;
                if (onDistanceCalculated) {
                    onDistanceCalculated(distanceMeters / 1000);
                }
            }
        }).catch(err => console.error('Directions failed', err));
    }, [directionsService, directionsRenderer, origin, destination, onDistanceCalculated]);

    return (
        <Map
            defaultCenter={{ lat: 19.4326, lng: -99.1332 }} // CDMX
            defaultZoom={10}
            mapId="QUOTE_MAP"
            style={{ width: '100%', height: '100%' }}
            disableDefaultUI={true}
            gestureHandling={'none'}
            onClick={onMapClick}
        />
    );
}
