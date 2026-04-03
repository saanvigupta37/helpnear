import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes } from '@/lib/constants';

const BADGE_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
    beginner: { emoji: '🌱', label: 'Beginner Helper', color: Colors.success },
    pro: { emoji: '⚡', label: 'Pro Helper', color: Colors.primary },
    lifesaver: { emoji: '🦸', label: 'Lifesaver', color: Colors.warning },
};

interface BadgesSectionProps {
    badges: string[];   // array of badge IDs
    points: number;
}

export function BadgesSection({ badges, points }: BadgesSectionProps) {
    return (
        <View style={styles.container}>
            {/* Points */}
            <View style={styles.pointsRow}>
                <Text style={styles.pointsLabel}>🏆 Points</Text>
                <Text style={styles.pointsValue}>{points}</Text>
            </View>

            {/* Badges */}
            {badges.length > 0 ? (
                <View style={styles.badgesRow}>
                    {badges.map((id) => {
                        const cfg = BADGE_CONFIG[id];
                        if (!cfg) return null;
                        return (
                            <View key={id} style={[styles.badge, { borderColor: cfg.color + '66' }]}>
                                <Text style={styles.badgeEmoji}>{cfg.emoji}</Text>
                                <Text style={[styles.badgeLabel, { color: cfg.color }]}>{cfg.label}</Text>
                            </View>
                        );
                    })}
                </View>
            ) : (
                <Text style={styles.noBadges}>Complete your first help to earn badges!</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { gap: 14 },
    pointsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingVertical: 14,
    },
    pointsLabel: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text },
    pointsValue: { fontSize: FontSizes.xl, fontWeight: '900', color: Colors.warning },
    badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 100,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1.5,
    },
    badgeEmoji: { fontSize: 18 },
    badgeLabel: { fontSize: FontSizes.sm, fontWeight: '700' },
    noBadges: { fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center', paddingVertical: 8 },
});
