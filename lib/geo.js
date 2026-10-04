// Haversine formula: returns distance in kilometers between two lat/lng points.
export function distanceKm(lat1, lng1, lat2, lng2) {
  if (
    lat1 == null || lng1 == null || lat2 == null || lng2 == null ||
    Number.isNaN(lat1) || Number.isNaN(lng1) || Number.isNaN(lat2) || Number.isNaN(lng2)
  ) {
    return null;
  }
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

export function formatDistance(km) {
  if (km == null) return "Konum bilinmiyor";
  if (km < 1) return Math.round(km * 1000) + " m";
  return km.toFixed(1) + " km";
}

const ENERGY_ORDER = { sakin: 0, orta: 1, enerjik: 2 };

export function energyMatchScore(a, b) {
  if (!a || !b) return null;
  const diff = Math.abs(ENERGY_ORDER[a] - ENERGY_ORDER[b]);
  if (diff === 0) return 96;
  if (diff === 1) return 78;
  return 55;
}
