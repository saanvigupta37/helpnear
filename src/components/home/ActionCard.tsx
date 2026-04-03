import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontSizes } from '@/lib/constants';

interface ActionCardProps {
    title: string;
    subtitle: string;
    emoji: string;
    onPress: () => void;
    variant?: 'request' | 'offer';
    style?: ViewStyle;
}

export function ActionCard({ title, subtitle, emoji, onPress, variant = 'request', style }: ActionCardProps) {
    const isRequest = variant === 'request';
    return (
        <TouchableOpacity
            style={[styles.card, isRequest ? styles.requestCard : styles.offerCard, style]}
            onPress={onPress}
            activeOpacity={0.85}
        >
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            <View style={[styles.arrow, isRequest ? styles.arrowRequest : styles.arrowOffer]}>
                <Text style={styles.arrowText}>→</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        borderRadius: 24,
        padding: 24,
        minHeight: 200,
        justifyContent: 'flex-end',
        position: 'relative',
        overflow: 'hidden',
    },
    requestCard: {
        backgroundColor: Colors.primary,
    },
    offerCard: {
        backgroundColor: Colors.surfaceElevated,
        borderWidth: 2,
        borderColor: Colors.border,
    },
    emoji: {
        fontSize: 48,
        position: 'absolute',
        top: 20,
        right: 20,
    },
    title: {
        fontSize: FontSizes['2xl'],
        fontWeight: '800',
        color: Colors.white,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: FontSizes.sm,
        color: Colors.white,
        opacity: 0.8,
        lineHeight: 20,
    },
    arrow: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    arrowRequest: { backgroundColor: 'rgba(255,255,255,0.25)' },
    arrowOffer: { backgroundColor: Colors.primary + '33' },
    arrowText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: '700',
    },
});
