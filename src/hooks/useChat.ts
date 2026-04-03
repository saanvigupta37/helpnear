import { useEffect, useState, useCallback, useRef } from 'react';
import { FlatList } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Message } from '@/lib/types';

export function useChat(requestId: string) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const listRef = useRef<FlatList | null>(null);

    const fetchMessages = useCallback(async () => {
        const { data } = await supabase
            .from('messages')
            .select('*, sender:users(id, name)')
            .eq('request_id', requestId)
            .order('created_at', { ascending: true });

        setMessages((data as Message[]) ?? []);
        setLoading(false);
    }, [requestId]);

    // Mark all messages from other party as read
    const markRead = useCallback(async () => {
        if (!user) return;
        await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('request_id', requestId)
            .neq('sender_id', user.id)
            .is('read_at', null);
    }, [requestId, user]);

    // Scroll to the bottom of the list
    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            listRef.current?.scrollToEnd({ animated: true });
        }, 80);
    }, []);

    useEffect(() => {
        fetchMessages();
        markRead();

        const channel = supabase
            .channel(`chat-${requestId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `request_id=eq.${requestId}`,
                },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new as Message]);
                    markRead();
                    scrollToBottom();
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [requestId, fetchMessages, markRead, scrollToBottom]);

    const sendMessage = async (text: string) => {
        if (!user || !text.trim()) return;
        await supabase.from('messages').insert({
            request_id: requestId,
            sender_id: user.id,
            message: text.trim(),
        });
    };

    return { messages, loading, sendMessage, listRef, scrollToBottom };
}
