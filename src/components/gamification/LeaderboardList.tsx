import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Colors, FontSizes } from '@/lib/constants';

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export function LeaderboardList() {
    const { entries, loading } = useLeaderboard();

    if (loading) {
        return <ActivityIndicator color={Colors.primary} style={{ marginVertical: 24 }} />;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>🏆 Top Helpers</Text>
            <FlatList
                data={entries}
                keyExtractor={(e) => e.id}
                scrollEnabled={false}
                renderItem={({ item }) => {
                    const rankColor = RANK_COLORS[item.rank - 1] ?? Colors.textSecondary;
                    const isTop3 = item.rank <= 3;
                    return (
                        <View style={[styles.row, isTop3 && styles.rowHighlighted]}>
                            <Text style={[styles.rank, { color: rankColor }]}>
                                {isTop3 ? ['🥇', '🥈', '🥉'][item.rank - 1] : `#${item.rank}`}
                            </Text>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {(item.name || '?')[0].toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.info}>
                                <Text style={styles.name} numberOfLines={1}>{item.name || 'Anonymous'}</Text>
                                <Text style={styles.meta}>
                                    {item.helps_completed} helps · ⭐ {item.avg_rating.toFixed(1)}
                                </Text>
                            </View>
                            <View style={styles.points}>
                                <Text style={styles.pointsValue}>{item.points}</Text>
                                <Text style={styles.pointsLabel}>pts</Text>
                            </View>
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <Text style={styles.empty}>No helpers yet. Be the first! 🦸</Text>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { gap: 4 },
    heading: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.text, marginBottom: 8 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 14,
        gap: 12,
        marginBottom: 6,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    rowHighlighted: {
        backgroundColor: Colors.surfaceElevated,
        borderColor: Colors.warning + '44',
    },
    rank: { fontSize: FontSizes.xl, fontWeight: '900', width: 32, textAlign: 'center' },
    avatar: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: Colors.primary + '33', alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { color: Colors.primary, fontWeight: '800', fontSize: FontSizes.md },
    info: { flex: 1 },
    name: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text },
    meta: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
    points: { alignItems: 'center' },
    pointsValue: { fontSize: FontSizes.lg, fontWeight: '900', color: Colors.warning },
    pointsLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, fontWeight: '600' },
    empty: { color: Colors.textMuted, textAlign: 'center', paddingVertical: 16 },
});
