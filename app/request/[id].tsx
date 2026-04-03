import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useChat } from '@/hooks/useChat';
import { useLiveLocation } from '@/hooks/useLiveLocation';
import { usePanic } from '@/hooks/usePanic';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { RequestMap } from '@/components/map/RequestMap';
import { PanicButton } from '@/components/safety/PanicButton';
import { SafetyBanner } from '@/components/safety/SafetyBanner';
import { RatingModal } from '@/components/rating/RatingModal';
import { Colors, FontSizes } from '@/lib/constants';
import type { HelpRequest } from '@/lib/types';

type Tab = 'chat' | 'map';

export default function ActiveHelpScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    const { location } = useLocation();
    const { logEvent } = useAnalytics();

    const [request, setRequest] = useState<HelpRequest | null>(null);
    const [tab, setTab] = useState<Tab>('chat');
    const [elapsed, setElapsed] = useState(0);
    const [completing, setCompleting] = useState(false);
    const [showRating, setShowRating] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const isHelper = request?.accepted_by === user?.id;

    // ── Hooks ────────────────────────────────────────────────
    const { messages, loading: chatLoading, sendMessage, listRef } = useChat(id ?? '');
    const { otherLocation } = useLiveLocation(id ?? '', isHelper);
    const { triggerPanic } = usePanic(id);
    const { otherIsTyping, startTyping, stopTyping } = useTypingIndicator(id ?? '');

    // ── Fetch request + Realtime status ──────────────────────
    useEffect(() => {
        if (!id) return;
        supabase
            .from('help_requests')
            .select('*, requester:users!requested_by(id, name), helper:users!accepted_by(id, name)')
            .eq('id', id)
            .single()
            .then(({ data }) => { if (data) setRequest(data as HelpRequest); });

        const ch = supabase
            .channel(`request-${id}`)
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'help_requests', filter: `id=eq.${id}` },
                (p) => { setRequest((prev) => prev ? { ...prev, ...(p.new as HelpRequest) } : null); }
            )
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [id]);

    // ── Task timer ───────────────────────────────────────────
    useEffect(() => {
        timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    // ── Auto-scroll to bottom on new message ─────────────────
    useEffect(() => {
        if (messages.length > 0) {
            listRef.current?.scrollToEnd({ animated: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages.length]);

    const formatTime = (s: number) =>
        `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    // ── Complete task ────────────────────────────────────────
    const handleComplete = async () => {
        Alert.alert('Complete Task?', 'Mark this help as done?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Complete ✓',
                onPress: async () => {
                    setCompleting(true);
                    await supabase
                        .from('help_requests')
                        .update({ status: 'Done' })
                        .eq('id', id);
                    logEvent('request_completed', { request_id: id, elapsed_seconds: elapsed });
                    setCompleting(false);
                    setShowRating(true); // Show rating modal after completion
                },
            },
        ]);
    };

    // ── Handle message send with typing stop ─────────────────
    const handleSend = (text: string) => {
        stopTyping();
        sendMessage(text);
        logEvent('message_sent', { request_id: id });
    };

    if (!request) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={Colors.primary} size="large" />
            </View>
        );
    }

    const myLocation = location ?? null;
    const requesterCoords = { latitude: request.lat, longitude: request.lng };
    const helperCoords = isHelper ? (myLocation ?? undefined) : (otherLocation ?? undefined);
    const otherPartyCoords = otherLocation ?? undefined;

    // Who to rate: helper rates requester and vice versa
    const ratedUser = isHelper ? request.requester : request.helper;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Safety banner */}
            <SafetyBanner />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.headerTitle}>
                        {isHelper ? '🦸 Helping' : '🙋 Getting Help'}
                    </Text>
                    <Text style={styles.timerText}>⏱ {formatTime(elapsed)}</Text>
                </View>
                {isHelper && (
                    <TouchableOpacity
                        style={[styles.completeBtn, completing && styles.completeBtnLoading]}
                        onPress={handleComplete}
                        disabled={completing}
                    >
                        <Text style={styles.completeBtnText}>{completing ? '…' : '✓ Done'}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Tab switcher */}
            <View style={styles.tabRow}>
                {(['chat', 'map'] as Tab[]).map((t) => (
                    <TouchableOpacity
                        key={t}
                        style={[styles.tab, tab === t && styles.tabActive]}
                        onPress={() => setTab(t)}
                    >
                        <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                            {t === 'chat' ? '💬 Chat' : '🗺️ Map'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content */}
            {tab === 'chat' ? (
                <View style={styles.chatContainer}>
                    {chatLoading ? (
                        <View style={styles.centered}>
                            <ActivityIndicator color={Colors.primary} />
                        </View>
                    ) : (
                        <FlatList
                            ref={listRef}
                            data={messages}
                            keyExtractor={(m) => m.id}
                            contentContainerStyle={styles.messageList}
                            renderItem={({ item }) => <ChatBubble message={item} />}
                            showsVerticalScrollIndicator={false}
                            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
                            ListEmptyComponent={
                                <View style={styles.chatEmpty}>
                                    <Text style={styles.chatEmptyEmoji}>👋</Text>
                                    <Text style={styles.chatEmptyText}>
                                        Say hello! This chat is private between you and your{' '}
                                        {isHelper ? 'requester' : 'helper'}.
                                    </Text>
                                </View>
                            }
                        />
                    )}
                    {/* Typing indicator */}
                    {otherIsTyping && <TypingIndicator />}
                    <ChatInput
                        onSend={handleSend}
                        onTypingStart={startTyping}
                        onTypingStop={stopTyping}
                    />
                </View>
            ) : (
                <View style={styles.mapContainer}>
                    {myLocation ? (
                        <RequestMap
                            requesterLocation={isHelper ? (otherPartyCoords ?? requesterCoords) : requesterCoords}
                            helperLocation={isHelper ? { latitude: myLocation.latitude, longitude: myLocation.longitude } : otherPartyCoords}
                        />
                    ) : (
                        <View style={styles.centered}>
                            <Text style={styles.noMapText}>📍 Waiting for location…</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Panic FAB */}
            <PanicButton onPress={triggerPanic} />

            {/* Rating modal */}
            {ratedUser && (
                <RatingModal
                    visible={showRating}
                    ratedUserId={ratedUser.id}
                    ratedUserName={ratedUser.name}
                    requestId={id ?? ''}
                    onDone={() => {
                        setShowRating(false);
                        router.replace('/(tabs)/home');
                    }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    headerLeft: { gap: 2 },
    headerTitle: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.text },
    timerText: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: '600' },
    completeBtn: {
        backgroundColor: Colors.success, borderRadius: 12,
        paddingHorizontal: 18, paddingVertical: 10,
    },
    completeBtnLoading: { opacity: 0.6 },
    completeBtnText: { color: Colors.white, fontWeight: '800', fontSize: FontSizes.sm },
    tabRow: {
        flexDirection: 'row', backgroundColor: Colors.surface,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    tab: {
        flex: 1, paddingVertical: 14, alignItems: 'center',
        borderBottomWidth: 3, borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomColor: Colors.primary },
    tabText: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textMuted },
    tabTextActive: { color: Colors.primary },
    chatContainer: { flex: 1 },
    messageList: { paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
    chatEmpty: { padding: 32, alignItems: 'center', gap: 12, marginTop: 40 },
    chatEmptyEmoji: { fontSize: 40 },
    chatEmptyText: {
        fontSize: FontSizes.md, color: Colors.textSecondary,
        textAlign: 'center', lineHeight: 24,
    },
    mapContainer: { flex: 1 },
    noMapText: { fontSize: FontSizes.md, color: Colors.textSecondary },
});
