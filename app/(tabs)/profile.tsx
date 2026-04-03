import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { Colors, FontSizes } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TrustedContactsManager } from '@/components/safety/TrustedContactsManager';
import { BadgesSection } from '@/components/gamification/BadgesSection';
import { LeaderboardList } from '@/components/gamification/LeaderboardList';

export default function ProfileScreen() {
    const { profile, signOut, loading } = useAuth();

    const handleSignOut = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: signOut },
        ]);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* ── Avatar & name ─────────────────────────────── */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarEmoji}>👤</Text>
                    </View>
                    <Text style={styles.name}>{profile?.name ?? 'Anonymous'}</Text>
                    <Text style={styles.phone}>{profile?.phone ?? '—'}</Text>
                    {profile?.is_verified && (
                        <View style={styles.verifiedBadge}>
                            <Text style={styles.verifiedText}>✓ Verified</Text>
                        </View>
                    )}
                    {/* Rating badge */}
                    {profile != null && profile.avg_rating > 0 && (
                        <View style={styles.ratingBadge}>
                            <Text style={styles.ratingText}>
                                ⭐ {profile.avg_rating.toFixed(1)}
                            </Text>
                        </View>
                    )}
                </View>

                {/* ── Stats ─────────────────────────────────────── */}
                <Card style={styles.statsCard}>
                    <View style={styles.statRow}>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{profile?.helps_completed ?? 0}</Text>
                            <Text style={styles.statLabel}>Helps Given</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{profile?.points ?? 0}</Text>
                            <Text style={styles.statLabel}>Points</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>
                                {profile != null && profile.avg_rating > 0 ? profile.avg_rating.toFixed(1) : '—'}
                            </Text>
                            <Text style={styles.statLabel}>Avg Rating</Text>
                        </View>
                    </View>
                </Card>

                {/* ── Badges & Points ───────────────────────────── */}
                <Card>
                    <BadgesSection
                        badges={(profile?.badges as string[]) ?? []}
                        points={profile?.points ?? 0}
                    />
                </Card>

                {/* ── Trusted Contacts ──────────────────────────── */}
                <Card>
                    <TrustedContactsManager />
                </Card>

                {/* ── Leaderboard ───────────────────────────────── */}
                <Card>
                    <LeaderboardList />
                </Card>

                {/* ── Menu ──────────────────────────────────────── */}
                <Card style={styles.menu}>
                    {[
                        { emoji: '⭐', label: 'Rate HelpNear', onPress: () => { } },
                        { emoji: '💬', label: 'Support', onPress: () => { } },
                        { emoji: 'ℹ️', label: 'About', onPress: () => { } },
                    ].map((item, index) => (
                        <TouchableOpacity
                            key={item.label}
                            style={[styles.menuItem, index > 0 && styles.menuItemBorder]}
                            onPress={item.onPress}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.menuEmoji}>{item.emoji}</Text>
                            <Text style={styles.menuLabel}>{item.label}</Text>
                            <Text style={styles.menuArrow}>›</Text>
                        </TouchableOpacity>
                    ))}
                </Card>

                <Button title="Sign Out" variant="outline" onPress={handleSignOut} loading={loading} />
                <Text style={styles.version}>HelpNear v1.0.0 Production</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { padding: 24, gap: 16, paddingBottom: 40 },
    avatarSection: { alignItems: 'center', gap: 6, paddingVertical: 12 },
    avatar: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center',
        borderWidth: 3, borderColor: Colors.primary, marginBottom: 8,
    },
    avatarEmoji: { fontSize: 48 },
    name: { fontSize: FontSizes['2xl'], fontWeight: '800', color: Colors.text },
    phone: { fontSize: FontSizes.md, color: Colors.textSecondary },
    verifiedBadge: {
        backgroundColor: Colors.success + '22', paddingHorizontal: 12,
        paddingVertical: 4, borderRadius: 100,
    },
    verifiedText: { color: Colors.success, fontSize: FontSizes.sm, fontWeight: '700' },
    ratingBadge: {
        backgroundColor: Colors.warning + '22', paddingHorizontal: 12,
        paddingVertical: 4, borderRadius: 100,
    },
    ratingText: { color: Colors.warning, fontSize: FontSizes.sm, fontWeight: '700' },
    statsCard: { padding: 0 },
    statRow: { flexDirection: 'row', alignItems: 'center' },
    stat: { flex: 1, alignItems: 'center', paddingVertical: 20 },
    statValue: { fontSize: FontSizes['2xl'], fontWeight: '800', color: Colors.text },
    statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 4 },
    divider: { width: 1, height: 40, backgroundColor: Colors.border },
    menu: { padding: 0 },
    menuItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 18, gap: 14,
    },
    menuItemBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
    menuEmoji: { fontSize: 22 },
    menuLabel: { flex: 1, fontSize: FontSizes.md, color: Colors.text, fontWeight: '600' },
    menuArrow: { fontSize: 22, color: Colors.textMuted },
    version: { textAlign: 'center', color: Colors.textMuted, fontSize: FontSizes.xs },
});
