
/**
 * Manual GIS utilities since PostGIS is not available.
 * Implements Ray-Casting for Point-In-Polygon and Haversine Distance.
 */

// Basic types
export interface Point {
    lat: number;
    lng: number;
}

export interface Polygon {
    type: string;
    coordinates: number[][][]; // GeoJSON format: [[[lng, lat], [lng, lat], ...]]
}

/**
 * Check if point is inside a polygon using Ray Casting Algorithm.
 * @param point Use {lat, lng} or [lng, lat] (GeoJSON order)
 * @param polygon GeoJSON polygon coordinates (usually [[[lng, lat], ...]])
 */
export function isPointInPolygon(point: Point, polygon: Polygon): boolean {
    if (!polygon || !polygon.coordinates || polygon.coordinates.length === 0) return false;

    const ring = polygon.coordinates[0];
    const x = point.lng;
    const y = point.lat;

    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1];
        const xj = ring[j][0], yj = ring[j][1];

        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

/**
 * Calculate distance between two points using Haversine formula.
 * @returns Distance in meters.
 */
export function haversineDistance(p1: Point, p2: Point): number {
    const R = 6371e3; // Earth radius in meters
    const lat1 = p1.lat * Math.PI / 180;
    const lat2 = p2.lat * Math.PI / 180;
    const deltaLat = (p2.lat - p1.lat) * Math.PI / 180;
    const deltaLng = (p2.lng - p1.lng) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Calculate minimum distance from a point to a polygon (rough approximation using vertices).
 * For true accuracy, we'd need point-to-segment distance.
 * This checks distance to all vertices and returns the minimum.
 */
export function minDistanceToPolygon(point: Point, polygon: Polygon): number {
    if (!polygon || !polygon.coordinates || polygon.coordinates.length === 0) return Infinity;

    const ring = polygon.coordinates[0];
    let minDist = Infinity;

    // Check distance to all vertices
    for (const vertex of ring) {
        const dist = haversineDistance(point, { lng: vertex[0], lat: vertex[1] });
        if (dist < minDist) minDist = dist;
    }

    // To be more precise, we should check perpendicular distance to edges, 
    // but vertex distance is often "good enough" for proximity alerts if vertices are dense.
    // We can improve this if needed.
    return minDist;
}
