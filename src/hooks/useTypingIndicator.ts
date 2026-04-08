import { useEffect, useState, useCallback, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface PresenceState {
    user_id: string;
    is_typing: boolean;
}

export function useTypingIndicator(requestId: string) {
    const { user } = useAuth();
    const [otherIsTyping, setOtherIsTyping] = useState(false);
    const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        const channel = supabase.channel(`typing-${requestId}`, {
            config: { presence: { key: user?.id ?? 'anon' } },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState<PresenceState>();
                const others = Object.entries(state)
                    .filter(([key]) => key !== user?.id)
                    .flatMap(([, presences]) => presences);

                setOtherIsTyping(others.some((p) => p.is_typing));
            })
            .subscribe();

        channelRef.current = channel;
        return () => { supabase.removeChannel(channel); };
    }, [requestId, user?.id]);

    const startTyping = useCallback(() => {
        channelRef.current?.track({ user_id: user?.id, is_typing: true });

        // Auto-clear after 2s of no keystrokes
        if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
        clearTimerRef.current = setTimeout(() => {
            channelRef.current?.track({ user_id: user?.id, is_typing: false });
        }, 2000);
    }, [user?.id]);

    const stopTyping = useCallback(() => {
        if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
        channelRef.current?.track({ user_id: user?.id, is_typing: false });
    }, [user?.id]);

    return { otherIsTyping, startTyping, stopTyping };
}
