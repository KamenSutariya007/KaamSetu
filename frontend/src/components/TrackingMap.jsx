import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useLanguage } from '../context/LanguageContext';
import { Clock, MapPin, Navigation, Compass } from 'lucide-react';
import { fetchRoadRoute } from '../services/osrm';
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
  const { t, lang } = useLanguage();
  const [position, setPosition] = useState(null);
  const [roadCoordinates, setRoadCoordinates] = useState([]);
  const [liveDistance, setLiveDistance] = useState(null);
  const [liveEta, setLiveEta] = useState(null);

  const isDemo = tracking?.is_demo_mode;
  const customerLat = parseFloat(tracking?.customer_latitude || booking?.latitude || 23.0225);
  const customerLng = parseFloat(tracking?.customer_longitude || booking?.longitude || 72.5714);

  // Initial provider position
  const initialProviderLat = parseFloat(tracking?.last_latitude || (customerLat + 0.015));
  const initialProviderLng = parseFloat(tracking?.last_longitude || (customerLng - 0.018));

  // Fetch real road route via OSRM
  useEffect(() => {
    let isMounted = true;
    const startLat = position ? position[0] : initialProviderLat;
    const startLng = position ? position[1] : initialProviderLng;

    fetchRoadRoute(startLat, startLng, customerLat, customerLng).then((res) => {
      if (isMounted && res && res.coordinates.length > 0) {
        setRoadCoordinates(res.coordinates);
        if (res.distanceKm) setLiveDistance(res.distanceKm);
        if (res.durationMin) setLiveEta(res.durationMin);
      }
    });

    return () => { isMounted = false; };
  }, [customerLat, customerLng]);

  // Handle live movement or animated demo route
  useEffect(() => {
    if (isDemo) {
      // If we have real road coordinates from OSRM, animate along real road!
      const pathPoints = roadCoordinates.length > 5
        ? roadCoordinates
        : (tracking?.demo_route?.map((p) => [p.lat, p.lng]) || []);

      if (pathPoints.length > 0) {
        let i = 0;
        const interval = setInterval(() => {
          const point = pathPoints[i % pathPoints.length];
          setPosition(point);
          i++;
        }, 1500);
        return () => clearInterval(interval);
      }
    }

    if (tracking?.last_latitude && tracking?.last_longitude) {
      setPosition([parseFloat(tracking.last_latitude), parseFloat(tracking.last_longitude)]);
    } else if (!position) {
      setPosition([initialProviderLat, initialProviderLng]);
    }
  }, [tracking, isDemo, roadCoordinates]);

  const center = position || [customerLat, customerLng];
  const activeRoute = roadCoordinates.length > 0
    ? roadCoordinates
    : (tracking?.demo_route?.map((p) => [p.lat, p.lng]) || []);

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-line shadow-card bg-surface">
      <div className="w-full min-w-0 h-64 sm:h-80 lg:h-96 relative">
        <MapContainer center={center} zoom={14} className="h-full w-full min-w-0 rounded-none">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
          <Marker position={[customerLat, customerLng]} icon={customerIcon}><Popup>Service Location</Popup></Marker>
          {position && <Marker position={position} icon={providerIcon}><Popup>Provider</Popup></Marker>}
          {activeRoute.length > 0 && (
            <Polyline
              positions={activeRoute}
              color="#635BFF"
              weight={roadCoordinates.length > 0 ? 5 : 4}
              dashArray={roadCoordinates.length > 0 ? undefined : "8"}
              opacity={0.85}
            />
          )}
        </MapContainer>
      </div>

      <div className="bg-surface border-t border-line p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 min-w-0">
        <div className="col-span-full flex items-center justify-between gap-2 text-xs font-medium pb-2 border-b border-line">
          {isDemo ? (
            <div className="flex items-center gap-2 text-cyan">
              <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" /> {t('demoTracking')}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-green">
              <span className="w-2 h-2 rounded-full bg-green animate-ping" />
              <span>Live GPS Active</span>
            </div>
          )}
          {roadCoordinates.length > 0 && (
            <span className="text-[11px] text-violet bg-violet/10 px-2 py-0.5 rounded-full font-semibold">
              🛣️ Street Route (OSRM)
            </span>
          )}
        </div>
        <div className="flex items-start gap-2">
          <Clock size={16} className="text-violet shrink-0 mt-0.5" />
          <div><p className="text-xs text-muted">ETA</p><p className="font-bold text-ink">{liveEta || tracking?.eta_minutes || '—'} min</p></div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={16} className="text-brand shrink-0 mt-0.5" />
          <div><p className="text-xs text-muted">Distance</p><p className="font-bold text-ink">{liveDistance || tracking?.distance_km || '—'} km</p></div>
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
