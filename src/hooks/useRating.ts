import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface RatingPayload {
    ratedUserId: string;
    requestId: string;
    score: number;
    review?: string;
}

interface UserRating {
    avg_rating: number;
    total_ratings: number;
}

export function useRating() {
    const { user } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submitRating = useCallback(
        async (payload: RatingPayload): Promise<boolean> => {
            if (!user) return false;
            setSubmitting(true);
            setError(null);

            const { error: err } = await supabase.from('ratings').insert({
                rater_id: user.id,
                rated_user_id: payload.ratedUserId,
                request_id: payload.requestId,
                score: payload.score,
                review: payload.review?.trim() ?? null,
            });

            setSubmitting(false);
            if (err) { setError(err.message); return false; }
            return true;
        },
        [user]
    );

    const getUserRating = useCallback(async (userId: string): Promise<UserRating> => {
        const { data } = await supabase
            .from('ratings')
            .select('score')
            .eq('rated_user_id', userId);

        const rows = (data as { score: number }[]) ?? [];
        const avg = rows.length ? rows.reduce((s, r) => s + r.score, 0) / rows.length : 0;
        return { avg_rating: Math.round(avg * 10) / 10, total_ratings: rows.length };
    }, []);

    return { submitRating, getUserRating, submitting, error };
}
