import { useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

interface PlaceAutocompleteProps {
    onPlaceSelect: (place: { address: string; lat: number; lng: number; details?: any }) => void;
    placeholder?: string;
    className?: string;
    defaultValue?: string;
}

export default function PlaceAutocomplete({ onPlaceSelect, placeholder, className, defaultValue }: PlaceAutocompleteProps) {
    const [placeAutocomplete, setPlaceAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const places = useMapsLibrary('places');

    useEffect(() => {
        if (!places || !inputRef.current) return;

        const options = {
            fields: ['geometry', 'name', 'formatted_address', 'address_components'],
            componentRestrictions: { country: 'mx' }, // Restrict to Mexico
        };

        setPlaceAutocomplete(new places.Autocomplete(inputRef.current, options));
    }, [places]);

    useEffect(() => {
        if (!placeAutocomplete) return;

        placeAutocomplete.addListener('place_changed', () => {
            const place = placeAutocomplete.getPlace();

            if (place.geometry && place.geometry.location) {
                // Parse address components
                const components: any = {};
                place.address_components?.forEach(component => {
                    const types = component.types;
                    if (types.includes('street_number')) components.streetNumber = component.long_name;
                    if (types.includes('route')) components.route = component.long_name;
                    if (types.includes('locality')) components.city = component.long_name;
                    if (types.includes('administrative_area_level_1')) components.state = component.long_name;
                    if (types.includes('postal_code')) components.zipCode = component.long_name;
                    if (types.includes('country')) components.country = component.long_name;
                });

                const street = components.route ? `${components.route} ${components.streetNumber || ''}`.trim() : '';

                onPlaceSelect({
                    address: place.formatted_address || place.name || '',
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                    details: {
                        street,
                        city: components.city || '',
                        state: components.state || '',
                        zipCode: components.zipCode || '',
                        country: components.country || ''
                    }
                });
            }
        });
    }, [onPlaceSelect, placeAutocomplete]);

    return (
        <>
            <input
                ref={inputRef}
                className={className}
                placeholder={placeholder}
                defaultValue={defaultValue}
            />
            {/* Force Google Maps Autocomplete dropdown to appear above modals */}
            <style jsx global>{`
                .pac-container {
                    z-index: 99999 !important;
                }
            `}</style>
        </>
    );
}
