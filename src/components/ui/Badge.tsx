import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes } from '@/lib/constants';

interface BadgeProps {
    label: string;
    variant?: 'urgency-normal' | 'urgency-urgent' | 'distance' | 'status' | 'time';
}

const variantConfig = {
    'urgency-normal': { bg: Colors.success + '22', text: Colors.success, prefix: '' },
    'urgency-urgent': { bg: Colors.danger + '22', text: Colors.danger, prefix: '🚨 ' },
    'distance': { bg: Colors.primary + '22', text: Colors.primaryLight, prefix: '📍 ' },
    'status': { bg: Colors.warning + '22', text: Colors.warning, prefix: '' },
    'time': { bg: Colors.textMuted + '33', text: Colors.textSecondary, prefix: '⏱ ' },
};

export function Badge({ label, variant = 'status' }: BadgeProps) {
    const config = variantConfig[variant];
    return (
        <View style={[styles.badge, { backgroundColor: config.bg }]}>
            <Text style={[styles.text, { color: config.text }]}>
                {config.prefix}{label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 100,
        alignSelf: 'flex-start',
    },
    text: {
        fontSize: FontSizes.xs,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});
