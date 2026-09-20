import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export interface LiveLocation {
  latitude: number;
  longitude: number;
  humanLocation: string;
  city?: string;
  accuracy?: number;
  source: 'gps' | 'ip' | 'cached';
  timestamp: number;
}

const PERMISSION_STORAGE_KEY = '@kinly_location_permission_status';

export async function getLocationPermissionStatus(): Promise<'granted' | 'denied' | 'prompt'> {
  try {
    // 1. Check native Expo Location permissions first
    const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
    if (status === Location.PermissionStatus.GRANTED) {
      await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, 'granted');
      return 'granted';
    }
    if (status === Location.PermissionStatus.DENIED && !canAskAgain) {
      await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, 'denied');
      return 'denied';
    }

    const stored = await AsyncStorage.getItem(PERMISSION_STORAGE_KEY);
    if (stored === 'granted' || stored === 'denied') return stored;

    if (typeof navigator !== 'undefined' && (navigator as any).permissions) {
      try {
        const p = await (navigator as any).permissions.query({ name: 'geolocation' });
        if (p.state === 'granted') {
          await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, 'granted');
          return 'granted';
        }
        if (p.state === 'denied') {
          await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, 'denied');
          return 'denied';
        }
      } catch (e) {}
    }
  } catch (e) {}
  return 'prompt';
}

export async function requestLocationPermission(): Promise<boolean> {
  try {
    // Request native Expo Location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === Location.PermissionStatus.GRANTED) {
      await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, 'granted');
      // Trigger instant high-accuracy location retrieval
      getCurrentLocation(true).catch(() => {});
      return true;
    } else {
      await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, 'denied');
      return false;
    }
  } catch (err) {
    // Web fallback if Expo Location request fails
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      return new Promise<boolean>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async () => {
            try {
              await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, 'granted');
            } catch (e) {}
            getCurrentLocation(true).catch(() => {});
            resolve(true);
          },
          async () => {
            try {
              await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, 'denied');
            } catch (e) {}
            resolve(false);
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });
    }
    await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, 'denied');
    return false;
  }
}

export async function setLocationPermissionDismissed(): Promise<void> {
  try {
    await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, 'denied');
  } catch (e) {}
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

export function lon2tileFraction(lon: number, zoom: number): number {
  return ((lon + 180) / 360) * Math.pow(2, zoom);
}

export function lat2tileFraction(lat: number, zoom: number): number {
  const sin = Math.sin((lat * Math.PI) / 180);
  const clampedSin = Math.min(Math.max(sin, -0.9999), 0.9999);
  return (
    (0.5 - Math.log((1 + clampedSin) / (1 - clampedSin)) / (4 * Math.PI)) *
    Math.pow(2, zoom)
  );
}

/**
 * Calculates pixel offset of target coordinates relative to center coordinates at given zoom level.
 * Guarantees pixel-perfect alignment between map tiles and markers.
 */
export function latLonToPixelOffset(
  targetLat: number,
  targetLon: number,
  centerLat: number,
  centerLon: number,
  zoom: number
): { dx: number; dy: number } {
  const centerFracX = lon2tileFraction(centerLon, zoom);
  const centerFracY = lat2tileFraction(centerLat, zoom);
  const targetFracX = lon2tileFraction(targetLon, zoom);
  const targetFracY = lat2tileFraction(targetLat, zoom);
  return {
    dx: (targetFracX - centerFracX) * 256,
    dy: (targetFracY - centerFracY) * 256,
  };
}

export type MapTileMode = 'osm-standard' | 'osm-dark' | 'osm-hot' | 'osm-positron' | 'satellite' | 'streets';

export function getOsmAttribution(mode: MapTileMode = 'osm-standard'): string {
  if (mode === 'satellite') {
    return '© Esri, Maxar, Earthstar';
  }
  if (mode === 'osm-standard') {
    return '© OpenStreetMap contributors';
  }
  if (mode === 'osm-hot') {
    return '© OpenStreetMap contributors, HOT';
  }
  return '© OpenStreetMap contributors, Esri';
}

export function getTileUrl(
  x: number,
  y: number,
  zoom: number,
  mode: MapTileMode = 'osm-standard',
  isDark: boolean = true
): string {
  const normX = ((x % Math.pow(2, zoom)) + Math.pow(2, zoom)) % Math.pow(2, zoom);
  const normY = ((y % Math.pow(2, zoom)) + Math.pow(2, zoom)) % Math.pow(2, zoom);

  if (mode === 'satellite') {
    return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${normY}/${normX}`;
  }

  // Official OpenStreetMap Standard tiles (100% Free, NO API key, zero watermark)
  if (mode === 'osm-standard' || (mode === 'streets' && !isDark)) {
    return `https://tile.openstreetmap.org/${zoom}/${normX}/${normY}.png`;
  }

  // OpenStreetMap Humanitarian style (100% Free, high clarity, NO API key, zero watermark)
  if (mode === 'osm-hot') {
    const subdomains = ['a', 'b', 'c'];
    const s = subdomains[Math.abs(normX + normY) % subdomains.length];
    return `https://${s}.tile.openstreetmap.fr/hot/${zoom}/${normX}/${normY}.png`;
  }

  // If user provided a CARTO API key in env, use CartoDB tiles with key
  const cartoKey = process.env.EXPO_PUBLIC_CARTO_API_KEY;
  if (cartoKey) {
    const subdomains = ['a', 'b', 'c', 'd'];
    const s = subdomains[Math.abs(normX + normY) % subdomains.length];
    const style = isDark ? 'dark_all' : 'light_all';
    return `https://${s}.basemaps.cartocdn.com/rastertiles/${style}/${zoom}/${normX}/${normY}.png?key=${cartoKey}`;
  }

  // High-contrast Dark Canvas: ArcGIS World Dark Gray Base (100% Free, NO API key, zero watermark)
  if (isDark || mode === 'osm-dark') {
    return `https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/${zoom}/${normY}/${normX}`;
  }

  // High-contrast Light Canvas: ArcGIS World Light Gray Base (100% Free, NO API key, zero watermark)
  return `https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/${zoom}/${normY}/${normX}`;
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  // 1. Primary: Native Expo Location reverseGeocodeAsync (iOS/Android native only)
  if (Platform.OS !== 'web') {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (results && results.length > 0) {
        const r = results[0];
        const place = r.name || r.street || r.district || r.subregion || '';
        const city = r.city || r.subregion || r.region || '';
        if (place && city && place !== city) return `${place}, ${city}`;
        if (place) return place;
        if (city) return city;
      }
    } catch (e) {}
  }

  // 2. OpenStreetMap Nominatim reverse geocoder
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

  // 3. ArcGIS World Geocoding Fallback
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
  // 1. GeoJS
  try {
    const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
    if (res.ok) {
      const data = await res.json();
      const lat = parseFloat(data.latitude);
      const lon = parseFloat(data.longitude);
      if (!isNaN(lat) && !isNaN(lon)) {
        const city = data.city || data.region || 'Local Area';
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
      }
    }
  } catch (e) {}

  // 2. ipwho.is fallback
  try {
    const res = await fetch('https://ipwho.is/');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false) {
        const lat = parseFloat(data.latitude);
        const lon = parseFloat(data.longitude);
        if (!isNaN(lat) && !isNaN(lon)) {
          const city = data.city || data.region || 'Local Area';
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
        }
      }
    }
  } catch (e) {}

  return null;
}

/**
 * Retrieves the device's real location.
 * Prioritizes high-accuracy GPS from Expo Location / Device GPS,
 * falling back to IP location only if GPS is unavailable or denied.
 */
export async function getCurrentLocation(forceFresh = false): Promise<LiveLocation> {
  if (!forceFresh && cachedLocation && cachedLocation.source === 'gps') {
    if (Date.now() - cachedLocation.timestamp < 20000) {
      return cachedLocation;
    }
  }

  // 1. Try Native Expo Location (High-Accuracy GPS on iOS / Android / Web)
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === Location.PermissionStatus.GRANTED) {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (pos && pos.coords) {
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
        return liveLoc;
      }
    }
  } catch (e) {}

  // 2. Try HTML5 Geolocation (Browser / Mobile Web)
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const liveLoc = await new Promise<LiveLocation>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const accuracy = Math.round(position.coords.accuracy || 10);
            const humanLocation = await reverseGeocode(lat, lon);

            const resLoc: LiveLocation = {
              latitude: lat,
              longitude: lon,
              humanLocation,
              accuracy,
              source: 'gps',
              timestamp: Date.now(),
            };
            cachedLocation = resLoc;
            notifyListeners(resLoc);
            resolve(resLoc);
          },
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
        );
      });
      return liveLoc;
    } catch (e) {}
  }

  // 3. Fallback to IP-based location if GPS is unavailable or denied
  const ipLoc = await getIpLocation();
  if (ipLoc) {
    notifyListeners(ipLoc);
    return ipLoc;
  }

  // 4. Return cached location if present
  if (cachedLocation) return cachedLocation;

  // 5. Ultimate fallback if completely offline
  return {
    latitude: 28.5498,
    longitude: 77.2005,
    humanLocation: 'Live Family Zone',
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
  }

  // Trigger high-accuracy fetch in background
  getCurrentLocation().then(callback).catch(() => {});

  let expoSubscription: Location.LocationSubscription | null = null;
  let webWatchId: number | null = null;

  // 1. Subscribe to Expo Location updates
  Location.getForegroundPermissionsAsync().then(({ status }) => {
    if (status === Location.PermissionStatus.GRANTED) {
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 6000,
          distanceInterval: 10,
        },
        async (location) => {
          const lat = location.coords.latitude;
          const lon = location.coords.longitude;
          const accuracy = Math.round(location.coords.accuracy || 10);
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
        }
      ).then((sub) => {
        expoSubscription = sub;
      }).catch(() => {});
    }
  }).catch(() => {});

  // 2. HTML5 Web watchPosition fallback
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    webWatchId = navigator.geolocation.watchPosition(
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
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 }
    );
  }

  return () => {
    listeners.delete(callback);
    if (expoSubscription) {
      expoSubscription.remove();
    }
    if (webWatchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(webWatchId);
    }
  };
}
