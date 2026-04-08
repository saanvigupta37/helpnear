import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useLocation } from '@/context/LocationContext';
import type { HelpRequest } from '@/lib/types';

export function useNearbyRequests() {
    const { location, loading: locationLoading } = useLocation();

    const [requests, setRequests] = useState<HelpRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRequests = useCallback(async () => {
        // ⛔ Wait until location finishes loading
        if (locationLoading) {
            console.log('⏳ Waiting for location...');
            return;
        }

        // ❌ No location after loading → show error
        if (!location) {
            console.log('❌ Location unavailable');
            setError('Location not available');
            setLoading(false);
            return;
        }

        console.log('📍 Fetching nearby for:', location);

        setLoading(true);
        setError(null);

        const { data, error } = await supabase.rpc('get_nearby_requests', {
            user_lat: location.latitude,
            user_lng: location.longitude,
            radius_meters: 500,
        });

        if (error) {
            console.error('❌ RPC ERROR:', error.message);
            setError(error.message);
        } else {
            console.log('✅ REQUESTS:', data);
            setRequests((data as HelpRequest[]) ?? []);
        }

        setLoading(false);
    }, [location, locationLoading]);

    useEffect(() => {
        fetchRequests();

        const channel = supabase
            .channel('nearby-requests')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'help_requests' },
                () => {
                    console.log('🔄 DB change detected');
                    fetchRequests();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchRequests]);

    return { requests, loading, error, refetch: fetchRequests };
}