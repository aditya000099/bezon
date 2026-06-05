import prisma from '../db/client.js';

export class GeoService {
  /**
   * Deterministically generates latitude and longitude for a pincode in India
   * to provide a fallback if coordinates are missing.
   */
  static getCoordinatesFromPincode(pincode: string): { lat: number; lng: number } {
    let hash = 0;
    const sanitized = pincode.trim().replace(/\s+/g, '');
    for (let i = 0; i < sanitized.length; i++) {
      hash = sanitized.charCodeAt(i) + ((hash << 5) - hash);
    }
    const absHash = Math.abs(hash);
    // India coordinates bounding box:
    // Latitude: ~8.4 to ~37.6
    // Longitude: ~68.7 to ~97.2
    const lat = 8.5 + (absHash % 270) / 10;
    const lng = 68.5 + ((absHash >> 3) % 270) / 10;
    return { lat, lng };
  }

  /**
   * Computes great-circle distance between two coordinates using the Haversine formula
   */
  static calculateHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  /**
   * Estimates delivery days based on distance:
   * Base is 2 days. For each subsequent 500kms, add 1 day.
   */
  static calculateDeliveryDays(distanceKm: number): number {
    if (distanceKm <= 500) return 2;
    return 2 + Math.ceil((distanceKm - 500) / 500);
  }
}
