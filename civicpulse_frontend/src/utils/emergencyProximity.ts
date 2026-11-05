// Emergency area proximity detection and priority boosting
// Uses OpenStreetMap Overpass API to find nearby emergency-relevant amenities

import { calculateDistanceMeters } from './helpers';

// ── Types ──────────────────────────────────────────────────────────────────────

export type EmergencyPlaceType =
  | 'hospital'
  | 'school'
  | 'fire_station'
  | 'police'
  | 'clinic'
  | 'kindergarten'
  | 'college'
  | 'university';

export interface NearbyEmergencyPlace {
  name: string;
  type: EmergencyPlaceType;
  distanceMeters: number;
  lat: number;
  lng: number;
}

export interface EmergencyProximityResult {
  isNearEmergencyZone: boolean;
  nearbyPlaces: NearbyEmergencyPlace[];
  priorityBoost: 'none' | 'high' | 'urgent';
  boostReason: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';
const API_TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Thresholds (in meters) that trigger each priority level */
const URGENT_THRESHOLD_CRITICAL = 200; // hospital, fire_station
const URGENT_THRESHOLD_EDUCATION = 300; // school, kindergarten, college, university
const HIGH_THRESHOLD = 500; // any emergency place

const CRITICAL_TYPES: ReadonlySet<EmergencyPlaceType> = new Set([
  'hospital',
  'fire_station',
]);

const EDUCATION_TYPES: ReadonlySet<EmergencyPlaceType> = new Set([
  'school',
  'kindergarten',
  'college',
  'university',
]);

// ── Cache ──────────────────────────────────────────────────────────────────────

interface CacheEntry {
  result: EmergencyProximityResult;
  timestamp: number;
}

const proximityCache = new Map<string, CacheEntry>();

/** Round coordinates to 2 decimal places to form a stable cache key */
function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

function getCached(lat: number, lng: number): EmergencyProximityResult | null {
  const key = cacheKey(lat, lng);
  const entry = proximityCache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    proximityCache.delete(key);
    return null;
  }
  return entry.result;
}

function setCache(lat: number, lng: number, result: EmergencyProximityResult): void {
  const key = cacheKey(lat, lng);
  proximityCache.set(key, { result, timestamp: Date.now() });
}

// ── Safe default (no boost) ────────────────────────────────────────────────────

function safeDefault(): EmergencyProximityResult {
  return {
    isNearEmergencyZone: false,
    nearbyPlaces: [],
    priorityBoost: 'none',
    boostReason: '',
  };
}

// ── Overpass query builder ─────────────────────────────────────────────────────

function buildOverpassQuery(lat: number, lng: number): string {
  return `[out:json][timeout:5];
(
  node["amenity"="hospital"](around:500,${lat},${lng});
  node["amenity"="school"](around:500,${lat},${lng});
  node["amenity"="fire_station"](around:500,${lat},${lng});
  node["amenity"="police"](around:500,${lat},${lng});
  node["amenity"="clinic"](around:500,${lat},${lng});
  node["amenity"="kindergarten"](around:500,${lat},${lng});
  node["amenity"="college"](around:500,${lat},${lng});
  node["amenity"="university"](around:500,${lat},${lng});
);
out body;`;
}

// ── Priority determination ─────────────────────────────────────────────────────

function determinePriority(
  places: NearbyEmergencyPlace[]
): Pick<EmergencyProximityResult, 'priorityBoost' | 'boostReason'> {
  let boost: EmergencyProximityResult['priorityBoost'] = 'none';
  let reason = '';

  for (const place of places) {
    // Urgent: critical facility within 200 m
    if (
      CRITICAL_TYPES.has(place.type) &&
      place.distanceMeters <= URGENT_THRESHOLD_CRITICAL
    ) {
      return {
        priorityBoost: 'urgent',
        boostReason: `Within ${place.distanceMeters}m of ${place.name || place.type} (${place.type})`,
      };
    }

    // Urgent: education facility within 300 m
    if (
      EDUCATION_TYPES.has(place.type) &&
      place.distanceMeters <= URGENT_THRESHOLD_EDUCATION
    ) {
      return {
        priorityBoost: 'urgent',
        boostReason: `Within ${place.distanceMeters}m of ${place.name || place.type} (${place.type})`,
      };
    }

    // High: any emergency place within 500 m
    if (place.distanceMeters <= HIGH_THRESHOLD && boost !== 'urgent') {
      boost = 'high';
      reason = `Within ${place.distanceMeters}m of ${place.name || place.type} (${place.type})`;
    }
  }

  return { priorityBoost: boost, boostReason: reason };
}

// ── Main exported function ─────────────────────────────────────────────────────

/**
 * Query the Overpass API for hospitals, schools, fire stations, police stations,
 * clinics, kindergartens, colleges, and universities within 500 m of the given
 * coordinates. Returns a priority-boost recommendation based on proximity.
 */
export async function checkNearbyEmergencyPlaces(
  lat: number,
  lng: number
): Promise<EmergencyProximityResult> {
  // Return cached result when available
  const cached = getCached(lat, lng);
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const response = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(buildOverpassQuery(lat, lng))}`,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return safeDefault();
    }

    const data = await response.json();
    const elements: Array<{
      lat: number;
      lon: number;
      tags?: Record<string, string>;
    }> = data.elements ?? [];

    // Map raw OSM elements to NearbyEmergencyPlace objects
    const places: NearbyEmergencyPlace[] = elements
      .filter((el) => el.tags?.amenity)
      .map((el) => ({
        name: el.tags?.name || el.tags?.amenity || 'Unknown',
        type: el.tags!.amenity as EmergencyPlaceType,
        distanceMeters: calculateDistanceMeters(lat, lng, el.lat, el.lon),
        lat: el.lat,
        lng: el.lon,
      }))
      .sort((a, b) => a.distanceMeters - b.distanceMeters);

    const { priorityBoost, boostReason } = determinePriority(places);

    const result: EmergencyProximityResult = {
      isNearEmergencyZone: places.length > 0,
      nearbyPlaces: places,
      priorityBoost,
      boostReason,
    };

    setCache(lat, lng, result);
    return result;
  } catch {
    // Timeout (AbortError) or network error — return safe default
    return safeDefault();
  }
}

// ── Human-readable label ───────────────────────────────────────────────────────

/**
 * Returns a human-readable label summarising the emergency proximity result.
 *
 * Examples:
 *   "⚠️ Near City General Hospital (120m) — Priority Auto-Boosted to Urgent"
 *   "ℹ️ Near Downtown Clinic (450m) — Priority Auto-Boosted to High"
 */
export function getEmergencyPriorityLabel(result: EmergencyProximityResult): string {
  if (result.priorityBoost === 'none' || result.nearbyPlaces.length === 0) {
    return '';
  }

  const closest = result.nearbyPlaces[0];
  const levelLabel = result.priorityBoost === 'urgent' ? 'Urgent' : 'High';
  const icon = result.priorityBoost === 'urgent' ? '⚠️' : 'ℹ️';

  return `${icon} Near ${closest.name} (${closest.distanceMeters}m) — Priority Auto-Boosted to ${levelLabel}`;
}
