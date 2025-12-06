'use client';

import { useEffect, useRef, useState } from 'react';

interface MapComponentProps {
    center?: { lat: number; lng: number };
    zoom?: number;
    markers?: { lat: number; lng: number; title?: string }[];
}

const DEFAULT_CENTER = { lat: 19.4326, lng: -99.1332 }; // Mexico City

export default function MapComponent({ center = DEFAULT_CENTER, zoom = 12, markers = [] }: MapComponentProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);

    useEffect(() => {
        const initMap = () => {
            if (mapRef.current && !map) {
                const newMap = new window.google.maps.Map(mapRef.current, {
                    center,
                    zoom,
                    styles: [
                        {
                            featureType: "poi",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }],
                        },
                    ],
                });
                setMap(newMap);
            }
        };

        if (!window.google) {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
            script.async = true;
            script.defer = true;
            script.onload = initMap;
            document.head.appendChild(script);
        } else {
            initMap();
        }
    }, [center, zoom, map]);

    useEffect(() => {
        if (map && markers.length > 0) {
            markers.forEach(marker => {
                new window.google.maps.Marker({
                    position: { lat: marker.lat, lng: marker.lng },
                    map,
                    title: marker.title,
                });
            });
        }
    }, [map, markers]);

    return <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: '400px', borderRadius: '0.5rem' }} />;
}
