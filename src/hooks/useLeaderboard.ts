import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface LeaderboardEntry {
    id: string;
    name: string;
    avatar_url: string | null;
    helps_completed: number;
    points: number;
    avg_rating: number;
    badges: string[];
    rank: number;
}

export function useLeaderboard() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase
            .from('leaderboard')
            .select('*')
            .limit(10)
            .then(({ data }) => {
                setEntries((data as LeaderboardEntry[]) ?? []);
                setLoading(false);
            });
    }, []);

    return { entries, loading };
}
