// src/components/RouteMap.jsx
import React from 'react';
import { GoogleMap, Polyline, Marker, useLoadScript } from '@react-google-maps/api';

const libraries = ['places', 'geometry'];

const RouteMap = ({ center, routeCoords, origin, destination }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAP_API_KEY,
    libraries,
  });

  if (loadError) return <div className="text-red-500 text-sm">Error loading map</div>;
  if (!isLoaded) return <div className="text-gray-500 text-sm">Loading map...</div>;

  return (
    <div className="h-64 w-full mt-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={12}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {routeCoords.length > 0 && (
          <Polyline
            path={routeCoords}
            options={{
              strokeColor: '#4F46E5',
              strokeOpacity: 1.0,
              strokeWeight: 4,
            }}
          />
        )}
        {origin && (
          <Marker
            position={origin}
            label="A"
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            }}
          />
        )}
        {destination && (
          <Marker
            position={destination}
            label="B"
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
};

export default RouteMap;