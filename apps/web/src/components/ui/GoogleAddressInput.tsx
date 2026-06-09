import { logger } from "@/utils/logger";
import React, { useEffect, useRef, useState } from 'react';
import { Input } from "@bezon/ui";
import { SpinnerIcon, MapPinIcon } from '@phosphor-icons/react';
import api from '../../lib/api';

interface SelectedAddress {
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  formattedAddress: string;
}

interface GoogleAddressInputProps {
  onAddressSelect: (address: SelectedAddress) => void;
  placeholder?: string;
  className?: string;
  defaultValue?: string;
}

let scriptLoadingPromise: Promise<void> | null = null;

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window !== 'undefined' && (window as any).google?.maps?.places) {
    return Promise.resolve();
  }
  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => {
      scriptLoadingPromise = null;
      reject(err);
    };
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

export const GoogleAddressInput: React.FC<GoogleAddressInputProps> = ({
  onAddressSelect,
  placeholder = 'Search for a location or address...',
  className = '',
  defaultValue = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    setInputValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    let active = true;

    const initAutocomplete = async () => {
      try {
        setLoading(true);
        // Fetch API key from configuration endpoint
        const res = await api.get('/api/v1/config/google-maps-key');
        const apiKey = res.data.data.googleMapsApiKey;

        if (!apiKey) {
          console.warn('Google Maps API Key missing in backend configuration.');
          setLoading(false);
          return;
        }

        if (!active) return;

        // Load script
        await loadGoogleMapsScript(apiKey);

        if (!active || !inputRef.current) return;

        // Initialize Google Autocomplete
        const google = (window as any).google;
        autocompleteRef.current = new google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ['geocode', 'establishment'],
            fields: [
              'address_components',
              'geometry',
              'formatted_address',
              'name',
            ],
          },
        );

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (!place.geometry || !place.geometry.location) {
            console.warn('No geometry returned for selected place.');
            return;
          }

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          let streetNumber = '';
          let route = '';
          let sublocality = '';
          let locality = '';
          let administrativeArea = '';
          let postalCode = '';

          if (place.address_components) {
            for (const component of place.address_components) {
              const types = component.types;
              if (types.includes('street_number')) {
                streetNumber = component.long_name;
              }
              if (types.includes('route')) {
                route = component.long_name;
              }
              if (
                types.includes('sublocality') ||
                types.includes('sublocality_level_1')
              ) {
                sublocality = component.long_name;
              }
              if (types.includes('locality')) {
                locality = component.long_name;
              }
              if (types.includes('administrative_area_level_1')) {
                administrativeArea = component.long_name;
              }
              if (types.includes('postal_code')) {
                postalCode = component.long_name;
              }
            }
          }

          // Build clean street address line
          let addressParts = [];
          if (streetNumber) addressParts.push(streetNumber);
          if (route) addressParts.push(route);
          if (sublocality && addressParts.length < 2)
            addressParts.push(sublocality);

          let addressLine = addressParts.join(', ');
          if (!addressLine) {
            addressLine = place.name || '';
          }

          const formattedAddress = place.formatted_address || '';
          setInputValue(formattedAddress);

          onAddressSelect({
            addressLine,
            city: locality || '',
            state: administrativeArea || '',
            pincode: postalCode || '',
            lat,
            lng,
            formattedAddress,
          });
        });

        setLoading(false);
      } catch (err) {
        logger.error('Failed to initialize Google Maps Autocomplete:', err);
        setLoading(false);
      }
    };

    initAutocomplete();

    return () => {
      active = false;
    };
  }, [onAddressSelect]);

  return (
    <div className="relative w-full">
      <div className="absolute left-3 top-3.5 text-zinc-400">
        {loading ? (
          <SpinnerIcon className="h-4 w-4 animate-spin text-teal-500" />
        ) : (
          <MapPinIcon className="h-4 w-4" />
        )}
      </div>
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className={`pl-9 pr-4 py-3 rounded-xl border border-zinc-200 w-full focus-visible:ring-2 focus-visible:ring-teal-500 ${className}`}
      />
    </div>
  );
};
