/**
 * OSRM (Open Source Routing Machine) Service
 * Free public routing API for street-level driving directions and ETA.
 */

export async function fetchRoadRoute(startLat, startLng, endLat, endLng) {
  if (!startLat || !startLng || !endLat || !endLng) return null;

  const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.routes || !data.routes.length) return null;

    const primaryRoute = data.routes[0];
    const coordinates = primaryRoute.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    const distanceKm = (primaryRoute.distance / 1000).toFixed(1);
    const durationMin = Math.ceil(primaryRoute.duration / 60);

    return {
      coordinates,
      distanceKm: parseFloat(distanceKm),
      durationMin,
    };
  } catch (err) {
    // Graceful fallback to null when offline or network fails
    console.debug('OSRM routing fetch skipped or timed out:', err.message);
    return null;
  }
}
