import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Village {
  id: number;
  name: string;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  adarsh_score: number;
  is_adarsh_candidate: boolean;
  geometry?: any;
}

interface VillageMapProps {
  villages: Village[];
  onVillageSelect?: (village: Village) => void;
}

const VillageMap: React.FC<VillageMapProps> = ({ villages, onVillageSelect }) => {
  const mapRef = useRef<L.Map | null>(null);

  const getColorForScore = (score: number) => {
    if (score >= 85) return '#008000'; // Green for Adarsh
    if (score >= 70) return '#90EE90'; // Light green
    if (score >= 50) return '#FFD700'; // Yellow
    return '#FF6B6B'; // Red
  };

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={[20.5937, 78.9629]} // Center of India
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {villages.map((village) => {
          if (!village.latitude || !village.longitude) return null;

          const color = getColorForScore(village.adarsh_score || 0);

          return (
            <Marker
              key={village.id}
              position={[village.latitude, village.longitude]}
              icon={L.divIcon({
                className: 'custom-marker',
                html: `<div style="
                  background-color: ${color};
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  border: 2px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                "></div>`,
                iconSize: [20, 20],
              })}
              eventHandlers={{
                click: () => {
                  onVillageSelect?.(village);
                },
              }}
            >
              <Popup>
                <div>
                  <h3>{village.name}</h3>
                  <p>State: {village.state}</p>
                  <p>District: {village.district}</p>
                  <p>Adarsh Score: {village.adarsh_score?.toFixed(1) || 'N/A'}</p>
                  {village.is_adarsh_candidate && (
                    <p><strong>Adarsh Candidate</strong></p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
        {villages.map((village) => {
          if (!village.geometry || village.geometry.type !== 'Polygon') return null;
          
          return (
            <GeoJSON
              key={`geo-${village.id}`}
              data={village.geometry}
              style={{
                color: getColorForScore(village.adarsh_score || 0),
                weight: 2,
                opacity: 0.7,
                fillOpacity: 0.2,
              }}
              eventHandlers={{
                click: () => {
                  onVillageSelect?.(village);
                },
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
};

export default VillageMap;
