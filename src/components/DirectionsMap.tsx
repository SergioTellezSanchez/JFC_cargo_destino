'use client';

import { useEffect, useState } from 'react';
import { Map, useMapsLibrary, useMap, MapMouseEvent, Marker } from '@vis.gl/react-google-maps';

interface DirectionsMapProps {
    origin: { lat: number; lng: number } | null;
    destination: { lat: number; lng: number } | null;
    onDistanceChange?: (distanceKm: number) => void;
    onDurationChange?: (duration: string) => void;
    onMapClick?: (e: MapMouseEvent) => void;
    showTraffic?: boolean;
}

function DirectionsController({ origin, destination, onDistanceChange, onDurationChange, showTraffic }: DirectionsMapProps) {
    const map = useMap(); // Access parent map instance reliably
    const routesLibrary = useMapsLibrary('routes');
    const mapsLibrary = useMapsLibrary('maps'); // For TrafficLayer
    const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
    const [trafficLayer, setTrafficLayer] = useState<google.maps.TrafficLayer | null>(null);

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

    // Handle Traffic Layer
    useEffect(() => {
        if (!map || !mapsLibrary) return;

        if (showTraffic) {
            const layer = new mapsLibrary.TrafficLayer();
            layer.setMap(map);
            setTrafficLayer(layer);
            return () => {
                layer.setMap(null);
            };
        } else {
            if (trafficLayer) {
                trafficLayer.setMap(null);
                setTrafficLayer(null);
            }
        }
    }, [showTraffic, map, mapsLibrary]);


    // Calculate Route
    useEffect(() => {
        if (!directionsService || !directionsRenderer || !origin || !destination) return;

        directionsService.route({
            origin,
            destination,
            travelMode: google.maps.TravelMode.DRIVING,
            drivingOptions: {
                departureTime: new Date(), // Required for traffic-based duration
                trafficModel: google.maps.TrafficModel.BEST_GUESS
            }
        }).then(response => {
            directionsRenderer.setDirections(response);

            // Explicitly fit bounds
            if (response.routes[0] && response.routes[0].bounds && map) {
                map.fitBounds(response.routes[0].bounds);
            }

            if (response.routes[0] && response.routes[0].legs[0]) {
                const leg = response.routes[0].legs[0];
                const distanceMeters = leg.distance?.value || 0;
                // Use duration_in_traffic if available, else duration
                const durationText = leg.duration_in_traffic?.text || leg.duration?.text || '';

                if (onDistanceChange) {
                    onDistanceChange(distanceMeters / 1000);
                }
                if (onDurationChange && durationText) {
                    onDurationChange(durationText);
                }
            }
        }).catch(err => {
            console.error('Directions failed', err);
        });
    }, [directionsService, directionsRenderer, origin, destination, onDistanceChange, onDurationChange, map]);

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
