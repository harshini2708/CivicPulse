import React, { useEffect, useRef, useId } from 'react';

// Leaflet is loaded via CDN; types from @types/leaflet
import L from 'leaflet';

// Fix default marker icon path broken by Vite/webpack bundling
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface MapMarker {
  lat: number;
  lng: number;
  title: string;
  color?: 'primary' | 'secondary' | 'error' | 'success' | 'warning';
  popup?: string;
  trackingId?: string;
}

interface OpenStreetMapProps {
  /** Center coordinates */
  center: { lat: number; lng: number };
  /** Zoom level 1–19 */
  zoom?: number;
  /** Markers to display */
  markers?: MapMarker[];
  /** Height CSS string e.g. "250px" or "100%" */
  height?: string;
  /** If > 0, draws a circle of this radius in metres around center */
  radiusMetres?: number;
  /** Additional className */
  className?: string;
  /** Callback when a marker is clicked */
  onMarkerClick?: (marker: MapMarker) => void;
}

const MARKER_COLORS: Record<string, string> = {
  primary: '#3B6EB5',
  secondary: '#426086',
  error: '#D23B3B',
  success: '#2D7D52',
  warning: '#B87333',
};

function makeIcon(color: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24C24 5.37 18.63 0 12 0z" fill="${color}"/>
      <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
    className: '',
  });
}

export const OpenStreetMap: React.FC<OpenStreetMapProps> = ({
  center,
  zoom = 15,
  markers = [],
  height = '280px',
  radiusMetres,
  className = '',
  onMarkerClick,
}) => {
  const uid = useId().replace(/:/g, '');
  const containerId = `osm-map-${uid}`;
  const mapRef = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialise map once
  useEffect(() => {
    if (mapRef.current) return; // already initialised

    const container = document.getElementById(containerId);
    if (!container) return;

    const map = L.map(containerId, {
      center: [center.lat, center.lng],
      zoom,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId]);

  // Update center / zoom when props change
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView([center.lat, center.lng], zoom, { animate: true });
  }, [center.lat, center.lng, zoom]);

  // Update radius circle
  useEffect(() => {
    if (!mapRef.current) return;
    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }
    if (radiusMetres && radiusMetres > 0) {
      circleRef.current = L.circle([center.lat, center.lng], {
        radius: radiusMetres,
        color: '#3B6EB5',
        fillColor: '#3B6EB5',
        fillOpacity: 0.08,
        weight: 1.5,
      }).addTo(mapRef.current);
    }
  }, [center.lat, center.lng, radiusMetres]);

  // Update markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    markers.forEach((m) => {
      const color = MARKER_COLORS[m.color || 'primary'];
      const icon = makeIcon(color);
      const lMarker = L.marker([m.lat, m.lng], { icon }).addTo(mapRef.current!);

      if (m.popup || m.title) {
        lMarker.bindPopup(
          `<div style="font-family:Inter,sans-serif;font-size:13px;font-weight:600;color:#1a1a2e;">${
            m.trackingId ? `<span style="color:#3B6EB5">#${m.trackingId}</span> — ` : ''
          }${m.popup || m.title}</div>`,
          { maxWidth: 220 }
        );
      }

      if (onMarkerClick) {
        lMarker.on('click', () => onMarkerClick(m));
      }

      markersRef.current.push(lMarker);
    });
  }, [markers, onMarkerClick]);

  return (
    <div
      id={containerId}
      style={{ height }}
      className={`w-full rounded-xl overflow-hidden border border-outline-variant/30 shadow-sm z-0 ${className}`}
    />
  );
};
