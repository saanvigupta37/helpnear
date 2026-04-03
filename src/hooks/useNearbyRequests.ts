import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useLocation } from '@/context/LocationContext';
import type { HelpRequest } from '@/lib/types';

export interface RankedHelpRequest extends HelpRequest {
    score: number;
}

export function useNearbyRequests() {
    const { location } = useLocation();
    const [requests, setRequests] = useState<RankedHelpRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRequests = useCallback(async () => {
        if (!location) return;
        setLoading(true);
        setError(null);

        // Use the new ranked RPC instead of the basic distance-only one
        const { data, error: err } = await supabase.rpc('get_ranked_requests', {
            user_lat: location.latitude,
            user_lng: location.longitude,
            radius_meters: 500,
        });

        if (err) {
            setError(err.message);
        } else {
            setRequests((data as RankedHelpRequest[]) ?? []);
        }
        setLoading(false);
    }, [location]);

    useEffect(() => {
        fetchRequests();

        const channel = supabase
            .channel('nearby-requests')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'help_requests' },
                () => { fetchRequests(); }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchRequests]);

    return { requests, loading, error, refetch: fetchRequests };
}
