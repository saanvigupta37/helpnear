import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionCard } from '@/components/home/ActionCard';
import { Colors, FontSizes } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';

export default function HomeScreen() {
    const { profile } = useAuth();

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>{greeting()} 👋</Text>
                        <Text style={styles.name}>{profile?.name ?? 'there'}</Text>
                    </View>
                    <View style={styles.statBadge}>
                        <Text style={styles.statNumber}>{profile?.helps_completed ?? 0}</Text>
                        <Text style={styles.statLabel}>helps</Text>
                    </View>
                </View>

                {/* Hero text */}
                <View style={styles.hero}>
                    <Text style={styles.heroText}>What do you need?</Text>
                    <Text style={styles.heroSub}>
                        Help is just seconds away from someone nearby.
                    </Text>
                </View>

                {/* Action cards */}
                <View style={styles.cardRow}>
                    <ActionCard
                        title="Request Help"
                        subtitle="Get help from someone nearby in minutes"
                        emoji="🙋"
                        variant="request"
                        onPress={() => router.push('/request/new')}
                        style={styles.card}
                    />
                    <ActionCard
                        title="Offer Help"
                        subtitle="See who needs help around you"
                        emoji="🦸"
                        variant="offer"
                        onPress={() => router.push('/(tabs)/nearby')}
                        style={styles.card}
                    />
                </View>

                {/* Safety note */}
                <View style={styles.safetyNote}>
                    <Text style={styles.safetyIcon}>🛡️</Text>
                    <Text style={styles.safetyText}>
                        All sessions have live location sharing and a panic button for your safety.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { flex: 1 },
    content: { padding: 24, gap: 28, paddingBottom: 40 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: { fontSize: FontSizes.md, color: Colors.textSecondary, fontWeight: '500' },
    name: { fontSize: FontSizes['2xl'], fontWeight: '800', color: Colors.text },
    statBadge: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 16,
        paddingVertical: 10,
        alignItems: 'center',
    },
    statNumber: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.primary },
    statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontWeight: '600' },
    hero: { gap: 6 },
    heroText: {
        fontSize: FontSizes['3xl'],
        fontWeight: '900',
        color: Colors.text,
        lineHeight: 40,
    },
    heroSub: { fontSize: FontSizes.md, color: Colors.textSecondary, lineHeight: 24 },
    cardRow: { gap: 16 },
    card: { width: '100%' },
    safetyNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    safetyIcon: { fontSize: 20 },
    safetyText: {
        flex: 1,
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
});
