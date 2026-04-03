import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import * as Location from 'expo-location';
import type { Coordinates } from '@/lib/types';

// Optimised for battery: 8s interval, 15m distance threshold
const LOCATION_CONFIG: Location.LocationOptions = {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 8000,
    distanceInterval: 15,
};

export function useLiveLocation(requestId: string, isHelper: boolean) {
    const { user } = useAuth();
    const { location } = useLocation();
    const [otherLocation, setOtherLocation] = useState<Coordinates | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Push own location at reduced frequency
    useEffect(() => {
        if (!user || !location) return;

        const updateLocation = async () => {
            let coords = location;
            try {
                const pos = await Location.getCurrentPositionAsync(LOCATION_CONFIG);
                coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            } catch {
                // Fall back to last known location from context
            }

            const updateField = isHelper
                ? { helper_lat: coords.latitude, helper_lng: coords.longitude }
                : { requester_lat: coords.latitude, requester_lng: coords.longitude };

            await supabase
                .from('active_sessions')
                .update(updateField)
                .eq('request_id', requestId);
        };

        updateLocation();
        // Use 8s interval (was 5s) for better battery life
        intervalRef.current = setInterval(updateLocation, 8000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [user, location, requestId, isHelper]);

    // Subscribe to realtime location from the other party
    useEffect(() => {
        const channel = supabase
            .channel(`location-${requestId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'active_sessions',
                    filter: `request_id=eq.${requestId}`,
                },
                (payload) => {
                    const data = payload.new as Record<string, number | null>;
                    if (isHelper && data.requester_lat && data.requester_lng) {
                        setOtherLocation({ latitude: data.requester_lat, longitude: data.requester_lng });
                    } else if (!isHelper && data.helper_lat && data.helper_lng) {
                        setOtherLocation({ latitude: data.helper_lat, longitude: data.helper_lng });
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [requestId, isHelper]);

    return { otherLocation };
}
