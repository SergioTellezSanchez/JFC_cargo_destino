import { useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

interface PlaceAutocompleteProps {
    onPlaceSelect: (place: { address: string; lat: number; lng: number }) => void;
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
            fields: ['geometry', 'name', 'formatted_address'],
            componentRestrictions: { country: 'mx' }, // Restrict to Mexico
        };

        setPlaceAutocomplete(new places.Autocomplete(inputRef.current, options));
    }, [places]);

    useEffect(() => {
        if (!placeAutocomplete) return;

        placeAutocomplete.addListener('place_changed', () => {
            const place = placeAutocomplete.getPlace();

            if (place.geometry && place.geometry.location) {
                onPlaceSelect({
                    address: place.formatted_address || place.name || '',
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                });
            }
        });
    }, [onPlaceSelect, placeAutocomplete]);

    return (
        <input
            ref={inputRef}
            className={className}
            placeholder={placeholder}
            defaultValue={defaultValue}
        />
    );
}
