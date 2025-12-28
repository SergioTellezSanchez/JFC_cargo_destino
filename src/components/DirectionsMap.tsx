'use client';

import { useEffect, useState } from 'react';
import { Map, useMapsLibrary, useMap, MapMouseEvent, Marker } from '@vis.gl/react-google-maps';

interface DirectionsMapProps {
    origin: { lat: number; lng: number } | null;
    destination: { lat: number; lng: number } | null;
    onDistanceChange?: (distanceKm: number) => void;
    onMapClick?: (e: MapMouseEvent) => void;
}

function DirectionsController({ origin, destination, onDistanceChange }: DirectionsMapProps) {
    const map = useMap(); // Access parent map instance reliably
    const routesLibrary = useMapsLibrary('routes');
    const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

    // Initialize Service and Renderer
    useEffect(() => {
        if (!routesLibrary || !map) return;

        const service = new routesLibrary.DirectionsService();
        const renderer = new routesLibrary.DirectionsRenderer({
            map,
            suppressMarkers: true,
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

            // Explicitly fit bounds
            if (response.routes[0] && response.routes[0].bounds && map) {
                map.fitBounds(response.routes[0].bounds);
            }

            if (response.routes[0] && response.routes[0].legs[0]) {
                const distanceMeters = response.routes[0].legs[0].distance?.value || 0;
                if (onDistanceChange) {
                    onDistanceChange(distanceMeters / 1000);
                }
            }
        }).catch(err => {
            console.error('Directions failed', err);
            // Don't clear directions on error to avoid flickering if it's transient
        });
    }, [directionsService, directionsRenderer, origin, destination, onDistanceChange, map]);

    return (
        <>
            {origin && (
                <Marker
                    position={origin}
                    label={{ text: "Cargo", className: "map-marker-label" }}
                    title="Origen (Carga)"
                />
            )}
            {destination && (
                <Marker
                    position={destination}
                    label={{ text: "Destino", className: "map-marker-label" }}
                    title="Destino (Entrega)"
                />
            )}
        </>
    );
}

export default function DirectionsMap(props: DirectionsMapProps) {
    return (
        <Map
            defaultCenter={{ lat: 19.4326, lng: -99.1332 }} // CDMX
            defaultZoom={10}
            mapId="4b2094d4b3b1a5ccd5a74cb9"
            style={{ width: '100%', height: '100%' }}
            disableDefaultUI={true}
            zoomControl={true}
            streetViewControl={false}
            mapTypeControl={false}
            fullscreenControl={false}
            onClick={props.onMapClick}
        >
            <DirectionsController {...props} />
        </Map>
    );
}
