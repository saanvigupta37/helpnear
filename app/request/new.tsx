import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    Alert,
    TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { HelpTypeGrid } from '@/components/requests/HelpTypeGrid';
import { Button } from '@/components/ui/Button';
import { Colors, FontSizes, TIME_OPTIONS, URGENCY_LEVELS } from '@/lib/constants';
import { inferHelpType, detectSpam } from '@/lib/aiHelpers';
import type { HelpTypeId } from '@/lib/constants';
import type { UrgencyLevel, TimeOption } from '@/lib/constants';

const DEBOUNCE_MS = 500;

export default function NewRequestScreen() {
    const { user } = useAuth();
    const { location, requestPermission } = useLocation();
    const { logEvent } = useAnalytics();
    const { enqueue, isOnline } = useOfflineQueue();

    const [helpType, setHelpType] = useState<HelpTypeId | null>(null);
    const [timeNeeded, setTimeNeeded] = useState<TimeOption>(10);
    const [urgency, setUrgency] = useState<UrgencyLevel>('Normal');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [cooldownSecs, setCooldownSecs] = useState(0);
    const [aiSuggested, setAiSuggested] = useState(false);

    // ─── Rate-limit check ───────────────────────────────────
    useEffect(() => {
        if (!user) return;
        supabase
            .rpc('can_create_request', { p_user_id: user.id })
            .single()
            .then(({ data }) => {
                const result = data as { allowed: boolean; seconds_remaining: number } | null;
                if (result && !result.allowed) {
                    setCooldownSecs(result.seconds_remaining);
                }
            });
    }, [user]);

    // Countdown timer
    useEffect(() => {
        if (cooldownSecs <= 0) return;
        const t = setInterval(() => setCooldownSecs((s) => Math.max(0, s - 1)), 1000);
        return () => clearInterval(t);
    }, [cooldownSecs]);

    // ─── AI auto-categorisation (debounced) ─────────────────
    useEffect(() => {
        if (!note.trim()) { setAiSuggested(false); return; }
        const timer = setTimeout(() => {
            const inferred = inferHelpType(note);
            if (inferred && !helpType) {
                setHelpType(inferred);
                setAiSuggested(true);
            } else if (inferred && aiSuggested) {
                // Update suggestion only if it was AI-set
                setHelpType(inferred);
            }
        }, DEBOUNCE_MS);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [note]);

    const handleTypeSelect = useCallback((id: HelpTypeId) => {
        setHelpType(id);
        setAiSuggested(false); // user overrode AI suggestion
    }, []);

    // ─── Submit ──────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!helpType) {
            Alert.alert('Missing info', 'Please select what kind of help you need.');
            return;
        }

        // Spam detection
        if (detectSpam(note, 0)) {
            Alert.alert('Request blocked', 'Your request looks like spam. Please describe what you need.');
            return;
        }

        // Rate limit
        if (cooldownSecs > 0) {
            const mins = Math.ceil(cooldownSecs / 60);
            Alert.alert('Please wait', `You can create another request in ${mins} min${mins > 1 ? 's' : ''}.`);
            return;
        }

        let coords = location;
        if (!coords) {
            const granted = await requestPermission();
            if (!granted) {
                Alert.alert('Location needed', 'We need your location to find nearby helpers.');
                return;
            }
        }
        if (!coords) {
            Alert.alert('Location unavailable', 'Could not get your location. Try again.');
            return;
        }

        const payload = {
            type: helpType,
            urgency,
            time_needed: timeNeeded,
            note: note.trim() || null,
            status: 'Open',
            lat: coords.latitude,
            lng: coords.longitude,
            requested_by: user?.id,
        };

        setLoading(true);

        if (!isOnline) {
            // Enqueue for when back online
            await enqueue('help_requests', payload);
            setLoading(false);
            Alert.alert('Queued offline', 'Your request will be sent when you\'re back online.');
            router.back();
            return;
        }

        const { data, error } = await supabase
            .from('help_requests')
            .insert(payload)
            .select()
            .single();

        setLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            logEvent('request_created', { type: helpType, urgency, ai_suggested: aiSuggested });
            router.replace(`/request/${data.id}`);
        }
    };

    const cooldownMins = Math.ceil(cooldownSecs / 60);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Nav */}
            <View style={styles.nav}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backBtn}>← Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.navTitle}>Request Help</Text>
                <View style={{ width: 70 }} />
            </View>

            {/* Cooldown banner */}
            {cooldownSecs > 0 && (
                <View style={styles.cooldownBanner}>
                    <Text style={styles.cooldownText}>
                        ⏳ Request cooldown: {cooldownMins} min{cooldownMins > 1 ? 's' : ''} remaining
                    </Text>
                </View>
            )}

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Help type */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>What do you need?</Text>
                        {aiSuggested && (
                            <View style={styles.aiChip}>
                                <Text style={styles.aiChipText}>🤖 AI suggested</Text>
                            </View>
                        )}
                    </View>
                    <HelpTypeGrid selected={helpType} onSelect={handleTypeSelect} />
                </View>

                {/* Time needed */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How long will this take?</Text>
                    <View style={styles.timeRow}>
                        {TIME_OPTIONS.map((t) => (
                            <TouchableOpacity
                                key={t}
                                style={[styles.timeBtn, timeNeeded === t && styles.timeBtnSelected]}
                                onPress={() => setTimeNeeded(t)}
                            >
                                <Text style={[styles.timeBtnText, timeNeeded === t && styles.timeBtnTextSelected]}>
                                    {t} min
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Urgency */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Urgency level</Text>
                    <View style={styles.urgencyRow}>
                        {URGENCY_LEVELS.map((u) => (
                            <TouchableOpacity
                                key={u}
                                style={[
                                    styles.urgencyBtn,
                                    urgency === u && (u === 'Urgent' ? styles.urgencyUrgent : styles.urgencyNormal),
                                ]}
                                onPress={() => setUrgency(u)}
                            >
                                <Text style={styles.urgencyEmoji}>{u === 'Urgent' ? '🚨' : '🟢'}</Text>
                                <Text style={[styles.urgencyText, urgency === u && styles.urgencyTextSelected]}>
                                    {u}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Note — drives AI categorisation */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Describe what you need</Text>
                    <TextInput
                        style={styles.noteInput}
                        value={note}
                        onChangeText={setNote}
                        placeholder="e.g. I need help carrying groceries to 3rd floor..."
                        placeholderTextColor={Colors.textMuted}
                        multiline
                        numberOfLines={3}
                        maxLength={200}
                    />
                    <Text style={styles.charCount}>{note.length}/200 · Type to auto-detect help type 🤖</Text>
                </View>

                <Button
                    title={loading ? 'Sending…' : cooldownSecs > 0 ? `Please wait ${cooldownMins}m` : 'Find Help Now 🙋'}
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={cooldownSecs > 0}
                    style={styles.submitBtn}
                />

                <Text style={styles.locationNote}>
                    📍 Your exact location is only shared after a helper accepts.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    nav: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    backBtn: { color: Colors.primary, fontSize: FontSizes.md, fontWeight: '600', width: 70 },
    navTitle: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.text },
    cooldownBanner: {
        backgroundColor: Colors.warning + '22',
        paddingHorizontal: 20, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: Colors.warning + '44',
    },
    cooldownText: { color: Colors.warning, fontWeight: '700', fontSize: FontSizes.sm },
    scroll: { flex: 1 },
    content: { padding: 24, gap: 28, paddingBottom: 40 },
    section: { gap: 14 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sectionTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.text },
    aiChip: {
        backgroundColor: Colors.primary + '22', borderRadius: 100,
        paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.primary,
    },
    aiChipText: { color: Colors.primary, fontSize: FontSizes.xs, fontWeight: '700' },
    timeRow: { flexDirection: 'row', gap: 12 },
    timeBtn: {
        flex: 1, paddingVertical: 16, borderRadius: 14,
        backgroundColor: Colors.surfaceElevated, alignItems: 'center',
        borderWidth: 2, borderColor: 'transparent',
    },
    timeBtnSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
    timeBtnText: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textSecondary },
    timeBtnTextSelected: { color: Colors.primary },
    urgencyRow: { flexDirection: 'row', gap: 12 },
    urgencyBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 16, borderRadius: 14, backgroundColor: Colors.surfaceElevated,
        gap: 8, borderWidth: 2, borderColor: 'transparent',
    },
    urgencyNormal: { borderColor: Colors.success, backgroundColor: Colors.success + '15' },
    urgencyUrgent: { borderColor: Colors.danger, backgroundColor: Colors.danger + '15' },
    urgencyEmoji: { fontSize: 18 },
    urgencyText: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textSecondary },
    urgencyTextSelected: { color: Colors.text },
    noteInput: {
        backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1.5,
        borderColor: Colors.border, padding: 16, fontSize: FontSizes.md,
        color: Colors.text, textAlignVertical: 'top', minHeight: 90, lineHeight: 22,
    },
    charCount: { fontSize: FontSizes.xs, color: Colors.textMuted, textAlign: 'right' },
    submitBtn: { marginTop: 8 },
    locationNote: {
        fontSize: FontSizes.xs, color: Colors.textMuted,
        textAlign: 'center', lineHeight: 18, paddingBottom: 8,
    },
});
