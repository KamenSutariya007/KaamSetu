import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useLanguage } from '../context/LanguageContext';
import { Clock, MapPin, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const providerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
});

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
});

export default function TrackingMap({ tracking, booking }) {
  const { t } = useLanguage();
  const [position, setPosition] = useState(null);
  const isDemo = tracking?.is_demo_mode;
  const customerLat = parseFloat(tracking?.customer_latitude || booking?.latitude || 23.0225);
  const customerLng = parseFloat(tracking?.customer_longitude || booking?.longitude || 72.5714);

  useEffect(() => {
    if (isDemo && tracking?.demo_route) {
      let i = 0;
      const interval = setInterval(() => {
        const point = tracking.demo_route[i % tracking.demo_route.length];
        setPosition([point.lat, point.lng]);
        i++;
      }, 2000);
      return () => clearInterval(interval);
    }
    if (tracking?.last_latitude) setPosition([parseFloat(tracking.last_latitude), parseFloat(tracking.last_longitude)]);
  }, [tracking, isDemo]);

  const center = position || [customerLat, customerLng];
  const route = tracking?.demo_route?.map((p) => [p.lat, p.lng]) || [];

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-line shadow-card bg-surface">
      <div className="w-full min-w-0 h-64 sm:h-80 lg:h-96 relative">
        <MapContainer center={center} zoom={14} className="h-full w-full min-w-0 rounded-none">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
          <Marker position={[customerLat, customerLng]} icon={customerIcon}><Popup>Service Location</Popup></Marker>
          {position && <Marker position={position} icon={providerIcon}><Popup>Provider</Popup></Marker>}
          {route.length > 0 && <Polyline positions={route} color="#635BFF" weight={4} dashArray="8" />}
        </MapContainer>
      </div>

      <div className="bg-surface border-t border-line p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 min-w-0">
        {isDemo && (
          <div className="col-span-full flex items-center gap-2 text-cyan text-sm font-medium mb-1 pb-3 border-b border-line">
            <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" /> {t('demoTracking')}
          </div>
        )}
        <div className="flex items-start gap-2">
          <Clock size={16} className="text-violet shrink-0 mt-0.5" />
          <div><p className="text-xs text-muted">ETA</p><p className="font-bold text-ink">{tracking?.eta_minutes || '—'} min</p></div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={16} className="text-brand shrink-0 mt-0.5" />
          <div><p className="text-xs text-muted">Distance</p><p className="font-bold text-ink">{tracking?.distance_km || '—'} km</p></div>
        </div>
        <div className="flex items-start gap-2">
          <Navigation size={16} className="text-green shrink-0 mt-0.5" />
          <div><p className="text-xs text-muted">Status</p><p className="font-bold text-ink capitalize text-sm">{tracking?.status?.replace(/_/g, ' ') || 'En route'}</p></div>
        </div>
        <div className="flex items-start gap-2">
          <Clock size={16} className="text-muted shrink-0 mt-0.5" />
          <div><p className="text-xs text-muted">Updated</p><p className="font-bold text-ink text-sm">{tracking?.last_updated ? new Date(tracking.last_updated).toLocaleTimeString() : 'Now'}</p></div>
        </div>
      </div>
    </div>
  );
}
