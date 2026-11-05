// Utility functions for CityResolve

export function generateTrackingId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `CR-2026-${randomNum}`;
}

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m away`;
  }
  return `${(meters / 1000).toFixed(1)} km away`;
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return isoString;
  }
}

export function calculateSlaRemaining(slaDeadline: string): {
  isOverdue: boolean;
  text: string;
  badgeClass: string;
} {
  try {
    const deadline = new Date(slaDeadline).getTime();
    const now = Date.now();
    const diffMs = deadline - now;

    if (diffMs < 0) {
      const overdueHours = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
      return {
        isOverdue: true,
        text: `Overdue by ${overdueHours}h`,
        badgeClass: 'bg-error-container text-on-error-container',
      };
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours <= 6) {
      return {
        isOverdue: false,
        text: `Critical: ${diffHours}h left`,
        badgeClass: 'bg-error-container text-error',
      };
    }
    if (diffHours <= 24) {
      return {
        isOverdue: false,
        text: `${diffHours}h remaining`,
        badgeClass: 'bg-secondary-container/60 text-on-secondary-container',
      };
    }
    const diffDays = Math.floor(diffHours / 24);
    return {
      isOverdue: false,
      text: `${diffDays}d left`,
      badgeClass: 'bg-surface-container text-on-surface-variant',
    };
  } catch {
    return { isOverdue: false, text: 'Within SLA', badgeClass: 'bg-surface-container text-on-surface-variant' };
  }
}
