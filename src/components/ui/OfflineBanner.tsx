import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes } from '@/lib/constants';

interface OfflineBannerProps {
    queueLength?: number;
}

export function OfflineBanner({ queueLength = 0 }: OfflineBannerProps) {
    return (
        <View style={styles.banner}>
            <Text style={styles.dot}>●</Text>
            <Text style={styles.text}>
                You're offline{queueLength > 0 ? ` · ${queueLength} item${queueLength > 1 ? 's' : ''} queued` : ''}
            </Text>
            <Text style={styles.sub}>Will sync when back online</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        backgroundColor: Colors.textMuted + '33',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingHorizontal: 16,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    dot: { color: Colors.warning, fontSize: 8 },
    text: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.textSecondary },
    sub: { fontSize: FontSizes.xs, color: Colors.textMuted },
});
