import { useRef, useCallback } from 'react';
import type { Coordinates } from '@/lib/types';

const MAX_SPEED_KMH = 150;
const MAX_JUMP_KM = 5;
const HISTORY_SIZE = 3;

function haversineKm(a: Coordinates, b: Coordinates): number {
    const R = 6371;
    const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
    const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
    const sin2 =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((a.latitude * Math.PI) / 180) *
        Math.cos((b.latitude * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(sin2));
}

interface ValidationResult {
    isValid: boolean;
    reason?: string;
}

interface TimedCoord {
    coord: Coordinates;
    timestamp: number;
}

export function useLocationValidator() {
    const historyRef = useRef<TimedCoord[]>([]);

    const validate = useCallback((coord: Coordinates): ValidationResult => {
        const now = Date.now();
        const history = historyRef.current;

        if (history.length > 0) {
            const last = history[history.length - 1];
            const distKm = haversineKm(last.coord, coord);

            // Reject large coordinate jumps (likely GPS glitch)
            if (distKm > MAX_JUMP_KM) {
                return { isValid: false, reason: `Coordinate jump too large (${distKm.toFixed(1)}km)` };
            }

            // Reject unrealistically fast movement
            const elapsedHours = (now - last.timestamp) / 3600000;
            if (elapsedHours > 0) {
                const speedKmh = distKm / elapsedHours;
                if (speedKmh > MAX_SPEED_KMH) {
                    return { isValid: false, reason: `Speed too high (${speedKmh.toFixed(0)}km/h)` };
                }
            }
        }

        // Maintain rolling window of last N positions
        historyRef.current = [...history.slice(-(HISTORY_SIZE - 1)), { coord, timestamp: now }];
        return { isValid: true };
    }, []);

    const reset = useCallback(() => { historyRef.current = []; }, []);

    return { validate, reset };
}
