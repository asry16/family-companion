import { Platform } from 'react-native';

export interface LiveLocation {
  latitude: number;
  longitude: number;
  humanLocation: string;
  city?: string;
  accuracy?: number;
  source: 'gps' | 'ip' | 'cached';
  timestamp: number;
}

let cachedLocation: LiveLocation | null = null;
const listeners = new Set<(loc: LiveLocation) => void>();

export function lon2tile(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

export function lat2tile(lat: number, zoom: number): number {
  return Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  );
}

export type MapTileMode = 'osm-dark' | 'osm-standard' | 'osm-positron' | 'satellite' | 'streets';

export function getOsmAttribution(mode: MapTileMode = 'osm-dark'): string {
  if (mode === 'satellite') {
    return '© Esri, Maxar, Earthstar';
  }
  if (mode === 'osm-standard') {
    return '© OpenStreetMap contributors';
  }
  return '© OpenStreetMap contributors, © CARTO';
}

export function getTileUrl(
  x: number,
  y: number,
  zoom: number,
  mode: MapTileMode = 'streets',
  isDark: boolean = true
): string {
  const normX = ((x % Math.pow(2, zoom)) + Math.pow(2, zoom)) % Math.pow(2, zoom);
  const normY = ((y % Math.pow(2, zoom)) + Math.pow(2, zoom)) % Math.pow(2, zoom);

  if (mode === 'satellite') {
    return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${normY}/${normX}`;
  }

  if (mode === 'osm-standard') {
    // Official OpenStreetMap Standard tiles (Slippy Map format: {z}/{x}/{y}.png)
    return `https://tile.openstreetmap.org/${zoom}/${normX}/${normY}.png`;
  }

  if (mode === 'osm-positron' || (mode === 'streets' && !isDark)) {
    // CartoDB Positron - Light OpenStreetMap tiles
    const subdomains = ['a', 'b', 'c', 'd'];
    const s = subdomains[Math.abs(normX + normY) % subdomains.length];
    return `https://${s}.basemaps.cartocdn.com/rastertiles/light_all/${zoom}/${normX}/${normY}.png`;
  }

  // CartoDB Dark Matter - High-contrast Deep Indigo OpenStreetMap tiles
  const subdomains = ['a', 'b', 'c', 'd'];
  const s = subdomains[Math.abs(normX + normY) % subdomains.length];
  return `https://${s}.basemaps.cartocdn.com/rastertiles/dark_all/${zoom}/${normX}/${normY}.png`;
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  // 1. Primary: OpenStreetMap Nominatim reverse geocoder
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`;
    const res = await fetch(osmUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'KinlyFamilyCompanion/1.0 (https://kinly.family)',
      },
    });
    if (res.ok) {
      const osmData = await res.json();
      const a = osmData?.address;
      if (a) {
        const place = a.neighbourhood || a.suburb || a.quarter || a.village || a.road || '';
        const city = a.city || a.town || a.county || a.state_district || '';
        if (place && city && place !== city) return `${place}, ${city}`;
        if (city) return city;
        if (place) return place;
        if (osmData.display_name) return osmData.display_name.split(',')[0];
      }
    }
  } catch (err) {}

  // 2. High-availability Fallback: ArcGIS World Geocoding
  try {
    const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=pjson&location=${lon},${lat}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      const addr = data?.address;
      if (addr) {
        const primaryPlace = addr.Neighborhood || addr.District || addr.ShortLabel || addr.Address || '';
        const city = addr.City || addr.MetroArea || addr.Subregion || '';
        if (primaryPlace && city && primaryPlace !== city) {
          return `${primaryPlace}, ${city}`;
        }
        return addr.LongLabel || addr.Match_addr || city || primaryPlace || 'Current Location';
      }
    }
  } catch (e) {}

  return 'Current Location';
}

export async function getIpLocation(): Promise<LiveLocation | null> {
  try {
    const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
    if (!res.ok) throw new Error('GeoJS failed');
    const data = await res.json();
    const lat = parseFloat(data.latitude);
    const lon = parseFloat(data.longitude);
    if (isNaN(lat) || isNaN(lon)) return null;

    const city = data.city || data.region || 'Local';
    const loc: LiveLocation = {
      latitude: lat,
      longitude: lon,
      humanLocation: city,
      city,
      accuracy: 2500,
      source: 'ip',
      timestamp: Date.now(),
    };
    cachedLocation = loc;
    return loc;
  } catch (e) {
    return null;
  }
}

export async function getCurrentLocation(): Promise<LiveLocation> {
  if (cachedLocation) {
    // Return cached immediately if less than 30s old
    if (Date.now() - cachedLocation.timestamp < 30000) {
      return cachedLocation;
    }
  }

  // 1. Start IP lookup as fast fallback
  const ipPromise = getIpLocation();

  // 2. Try High Accuracy Device GPS if available
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    const gpsPromise = new Promise<LiveLocation>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const accuracy = Math.round(position.coords.accuracy || 10);
          const humanLocation = await reverseGeocode(lat, lon);

          const liveLoc: LiveLocation = {
            latitude: lat,
            longitude: lon,
            humanLocation,
            accuracy,
            source: 'gps',
            timestamp: Date.now(),
          };
          cachedLocation = liveLoc;
          notifyListeners(liveLoc);
          resolve(liveLoc);
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 15000 }
      );
    });

    try {
      return await Promise.race([gpsPromise, ipPromise.then((loc) => loc || gpsPromise)]);
    } catch (e) {
      const ip = await ipPromise;
      if (ip) return ip;
    }
  }

  const fallbackIp = await ipPromise;
  if (fallbackIp) return fallbackIp;

  // Ultimate safe default if completely offline
  return {
    latitude: 28.5498,
    longitude: 77.2005,
    humanLocation: 'Sanctuary Safe Zone',
    accuracy: 10,
    source: 'cached',
    timestamp: Date.now(),
  };
}

function notifyListeners(loc: LiveLocation) {
  listeners.forEach((cb) => {
    try {
      cb(loc);
    } catch (e) {}
  });
}

export function watchLocation(callback: (loc: LiveLocation) => void): () => void {
  listeners.add(callback);

  // Send current / cached immediately if present
  if (cachedLocation) {
    callback(cachedLocation);
  } else {
    getCurrentLocation().then(callback).catch(() => {});
  }

  let watchId: number | null = null;
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy || 10);
        const humanLocation = await reverseGeocode(lat, lon);

        const liveLoc: LiveLocation = {
          latitude: lat,
          longitude: lon,
          humanLocation,
          accuracy,
          source: 'gps',
          timestamp: Date.now(),
        };
        cachedLocation = liveLoc;
        notifyListeners(liveLoc);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }

  return () => {
    listeners.delete(callback);
    if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  };
}
