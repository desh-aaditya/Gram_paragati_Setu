import React, { useRef } from 'react';
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

  // Calculate center based on villages if available
  const calculateCenter = () => {
    if (villages.length === 0) {
      return [20.5937, 78.9629]; // Default center of India
    }

    const villagesWithCoords = villages.filter(v => v.latitude && v.longitude);
    if (villagesWithCoords.length === 0) {
      return [20.5937, 78.9629];
    }

    const avgLat = villagesWithCoords.reduce((sum, v) => sum + v.latitude, 0) / villagesWithCoords.length;
    const avgLng = villagesWithCoords.reduce((sum, v) => sum + v.longitude, 0) / villagesWithCoords.length;
    return [avgLat, avgLng];
  };

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {villages.length === 0 ? (
        <div style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          fontSize: '1.1rem'
        }}>
          No villages to display on map
        </div>
      ) : (
        <MapContainer
          center={calculateCenter() as any}
          zoom={villages.length === 1 ? 10 : 6}
          style={{ height: '100%', width: '100%', zIndex: 1 }}
          ref={(map) => {
            if (map) {
              mapRef.current = map;
            }
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
                  width: ${village.is_adarsh_candidate ? '24px' : '20px'};
                  height: ${village.is_adarsh_candidate ? '24px' : '20px'};
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                  cursor: pointer;
                  transition: transform 0.2s;
                " title="${village.name} - Score: ${village.adarsh_score?.toFixed(1) || 'N/A'}"></div>`,
                  iconSize: [village.is_adarsh_candidate ? 24 : 20, village.is_adarsh_candidate ? 24 : 20],
                })}
                eventHandlers={{
                  click: () => {
                    onVillageSelect?.(village);
                  },
                }}
              >
                <Popup>
                  <div style={{ minWidth: '200px' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#003366' }}>{village.name}</h3>
                    <p style={{ margin: '0.25rem 0' }}><strong>State:</strong> {village.state}</p>
                    <p style={{ margin: '0.25rem 0' }}><strong>District:</strong> {village.district}</p>
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Adarsh Score:</strong>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        marginLeft: '0.5rem',
                        backgroundColor: color,
                        color: 'white',
                        fontWeight: 'bold'
                      }}>
                        {village.adarsh_score?.toFixed(1) || 'N/A'}
                      </span>
                    </p>
                    {village.is_adarsh_candidate && (
                      <p style={{
                        margin: '0.5rem 0 0 0',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#008000',
                        color: 'white',
                        borderRadius: '4px',
                        textAlign: 'center',
                        fontWeight: 'bold'
                      }}>
                        ✓ Adarsh Candidate
                      </p>
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
      )}
    </div>
  );
};

export default VillageMap;