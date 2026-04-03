import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export type AnalyticsEventType =
    | 'request_created'
    | 'request_accepted'
    | 'request_completed'
    | 'panic_triggered'
    | 'message_sent'
    | 'rating_submitted'
    | 'contact_added';

export function useAnalytics() {
    const { user } = useAuth();

    const logEvent = useCallback(
        (eventType: AnalyticsEventType, payload: Record<string, unknown> = {}) => {
            // Fire-and-forget — never block UI for analytics
            supabase
                .from('analytics_events')
                .insert({
                    event_type: eventType,
                    user_id: user?.id ?? null,
                    payload,
                })
                .then(({ error }) => {
                    if (error) console.warn('[Analytics]', error.message);
                });
        },
        [user?.id]
    );

    return { logEvent };
}
