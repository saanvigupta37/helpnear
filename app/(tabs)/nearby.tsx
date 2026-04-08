import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNearbyRequests } from '@/hooks/useNearbyRequests';
import { RequestCard } from '@/components/requests/RequestCard';
import { Colors, FontSizes } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { HelpRequest } from '@/lib/types';

export default function NearbyScreen() {
    const { requests, loading, refetch } = useNearbyRequests();
    const { user } = useAuth();

    const handleAccept = async (request: HelpRequest) => {
        if (!user) {
            Alert.alert('Error', 'You must be logged in');
            return;
        }

        // 🔥 FIX 1: ensure correct status + error handling
        const { error } = await supabase
            .from('help_requests')
            .update({
                status: 'Accepted',
                accepted_by: user.id,
            })
            .eq('id', request.id)
            .eq('status', 'Open');

        if (error) {
            console.error('Accept error:', error.message);
            Alert.alert('Error', error.message);
            return;
        }

        // 🔥 FIX 2: create active session safely
        const { error: sessionError } = await supabase
            .from('active_sessions')
            .insert({
                request_id: request.id,
                live_location_enabled: true,
                panic_triggered: false,
            });

        if (sessionError) {
            console.error('Session error:', sessionError.message);
        }

        // Navigate to active request
        router.push(`/request/${request.id}`);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Nearby Requests</Text>
                    <Text style={styles.subtitle}>People needing help within 500m</Text>
                </View>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{requests.length}</Text>
                </View>
            </View>

            {loading && requests.length === 0 ? (
                <View style={styles.centered}>
                    <ActivityIndicator color={Colors.primary} size="large" />
                    <Text style={styles.loadingText}>Scanning nearby...</Text>
                </View>
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={loading}
                            onRefresh={refetch}
                            tintColor={Colors.primary}
                        />
                    }
                    renderItem={({ item }) => (
                        <RequestCard
                            request={item}
                            showAcceptButton
                            onAccept={() => handleAccept(item)}
                            onPress={() => { }}
                        />
                    )}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyEmoji}>🌍</Text>
                            <Text style={styles.emptyTitle}>All clear nearby</Text>
                            <Text style={styles.emptyText}>
                                No open requests within 500m right now. Check back soon!
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    title: { fontSize: FontSizes['2xl'], fontWeight: '800', color: Colors.text },
    subtitle: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
    countBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary + '22',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    countText: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.primary },
    list: { padding: 20, paddingBottom: 40 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: Colors.textSecondary, fontSize: FontSizes.md },
    empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
    emptyEmoji: { fontSize: 56 },
    emptyTitle: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text },
    emptyText: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
});