/**
 * KaamSetu — Native Leaflet Live GPS Tracking & Channels WebSocket Client
 */

function initTrackingMap(config) {
  const {
    containerId,
    bookingId,
    customerLat,
    customerLng,
    providerLat,
    providerLng,
    isDemo,
    status
  } = config;

  const mapElement = document.getElementById(containerId);
  if (!mapElement || typeof L === 'undefined') return;

  const startCustLat = parseFloat(customerLat) || 23.0225;
  const startCustLng = parseFloat(customerLng) || 72.5714;
  let curProvLat = parseFloat(providerLat) || (startCustLat + 0.015);
  let curProvLng = parseFloat(providerLng) || (startCustLng - 0.018);

  // Initialize Leaflet Map
  const map = L.map(containerId).setView([startCustLat, startCustLng], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  // Custom marker icons
  const customerIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  const providerIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  // Add markers
  const customerMarker = L.marker([startCustLat, startCustLng], { icon: customerIcon })
    .addTo(map)
    .bindPopup('<b>Service Location (Customer)</b>');

  const providerMarker = L.marker([curProvLat, curProvLng], { icon: providerIcon })
    .addTo(map)
    .bindPopup('<b>Service Professional</b>');

  let routePolyline = null;
  let roadCoordinates = [];

  // Fetch real road route from OSRM
  async function fetchRoute(pLat, pLng, cLat, cLng) {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${pLng},${pLat};${cLng},${cLat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const r = data.routes[0];
          roadCoordinates = r.geometry.coordinates.map(c => [c[1], c[0]]);
          
          if (routePolyline) map.removeLayer(routePolyline);
          routePolyline = L.polyline(roadCoordinates, {
            color: '#635BFF',
            weight: 5,
            opacity: 0.85
          }).addTo(map);

          // Update UI metrics
          const distKm = (r.distance / 1000).toFixed(1);
          const etaMin = Math.round(r.duration / 60);
          
          const distEl = document.getElementById('trackingDistance');
          const etaEl = document.getElementById('trackingEta');
          if (distEl) distEl.innerText = `${distKm} km`;
          if (etaEl) etaEl.innerText = `${etaMin} min`;
          
          map.fitBounds(routePolyline.getBounds(), { padding: [40, 40] });
        }
      }
    } catch (e) {
      console.warn('Could not fetch OSRM road route:', e);
      // Fallback straight line
      if (routePolyline) map.removeLayer(routePolyline);
      routePolyline = L.polyline([[pLat, pLng], [cLat, cLng]], {
        color: '#635BFF',
        dashArray: '8, 8',
        weight: 4
      }).addTo(map);
    }
  }

  fetchRoute(curProvLat, curProvLng, startCustLat, startCustLng);

  // Demo Movement Simulation
  if (isDemo) {
    let stepIndex = 0;
    setInterval(() => {
      if (roadCoordinates.length > 0) {
        const point = roadCoordinates[stepIndex % roadCoordinates.length];
        providerMarker.setLatLng(point);
        stepIndex++;
        const updatedEl = document.getElementById('trackingUpdated');
        if (updatedEl) updatedEl.innerText = new Date().toLocaleTimeString();
      }
    }, 1800);
  }

  // Real-time WebSocket connection via Django Channels
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/tracking/${bookingId}/`;
  
  try {
    const trackingSocket = new WebSocket(wsUrl);

    trackingSocket.onmessage = function(e) {
      try {
        const data = JSON.parse(e.data);
        if (data.latitude && data.longitude) {
          const newLat = parseFloat(data.latitude);
          const newLng = parseFloat(data.longitude);
          providerMarker.setLatLng([newLat, newLng]);
          const updatedEl = document.getElementById('trackingUpdated');
          if (updatedEl) updatedEl.innerText = new Date().toLocaleTimeString();
        }
      } catch (err) {
        console.error('WebSocket parse error:', err);
      }
    };

    trackingSocket.onclose = function() {
      console.log('Tracking WebSocket closed');
    };
  } catch (err) {
    console.warn('WebSocket connection error:', err);
  }
}
