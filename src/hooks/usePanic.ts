import { useEffect, useState, useCallback, useRef } from 'react';
import { Linking, Alert } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { EMERGENCY_NUMBER } from '@/lib/constants';

const PANIC_TRACK_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const PANIC_UPDATE_INTERVAL_MS = 5000;

export function usePanic(requestId?: string) {
    const { user } = useAuth();
    const { location } = useLocation();
    const trackingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const panicEndRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isTracking, setIsTracking] = useState(false);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (trackingRef.current) clearInterval(trackingRef.current);
            if (panicEndRef.current) clearTimeout(panicEndRef.current);
        };
    }, []);

    const stopTracking = useCallback(() => {
        if (trackingRef.current) { clearInterval(trackingRef.current); trackingRef.current = null; }
        if (panicEndRef.current) { clearTimeout(panicEndRef.current); panicEndRef.current = null; }
        setIsTracking(false);
    }, []);

    const startContinuousTracking = useCallback(async () => {
        if (!user || isTracking) return;
        setIsTracking(true);

        const pushLocation = async () => {
            const pos = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            }).catch(() => null);
            if (!pos || !user) return;

            await supabase.from('panic_sessions').insert({
                user_id: user.id,
                request_id: requestId ?? null,
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
            });

            // Also broadcast via active_sessions if in a request
            if (requestId) {
                await supabase
                    .from('active_sessions')
                    .update({
                        requester_lat: pos.coords.latitude,
                        requester_lng: pos.coords.longitude,
                    })
                    .eq('request_id', requestId);
            }
        };

        await pushLocation(); // First immediate push
        trackingRef.current = setInterval(pushLocation, PANIC_UPDATE_INTERVAL_MS);

        // Auto-stop after 10 min
        panicEndRef.current = setTimeout(stopTracking, PANIC_TRACK_DURATION_MS);
    }, [user, requestId, isTracking, stopTracking]);

    const triggerPanic = useCallback(async () => {
        try {
            // 1. Mark panic in active_sessions
            if (requestId) {
                await supabase
                    .from('active_sessions')
                    .update({ panic_triggered: true })
                    .eq('request_id', requestId);
            }

            // 2. Fetch trusted contacts
            const { data: contacts } = await supabase
                .from('trusted_contacts')
                .select('name, phone_number')
                .eq('user_id', user?.id ?? '');

            // 3. Call upgraded Edge Function with contacts + location
            if (user && location) {
                await supabase.functions.invoke('panic-alert', {
                    body: {
                        user_id: user.id,
                        lat: location.latitude,
                        lng: location.longitude,
                        request_id: requestId,
                        contacts: contacts ?? [],
                    },
                });
            }

            // 4. Start continuous location tracking (non-blocking)
            startContinuousTracking();
        } catch (e) {
            console.error('Panic alert error:', e);
        }

        // 5. Prompt emergency call
        Alert.alert(
            '🆘 Emergency',
            'Panic alert sent to your trusted contacts. Call emergency services now?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: `Call ${EMERGENCY_NUMBER}`,
                    style: 'destructive',
                    onPress: () => Linking.openURL(`tel:${EMERGENCY_NUMBER}`),
                },
            ]
        );
    }, [requestId, user, location, startContinuousTracking]);

    return { triggerPanic, isTracking, stopTracking };
}
