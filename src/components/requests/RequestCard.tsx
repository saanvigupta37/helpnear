import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, FontSizes, HELP_TYPES } from '@/lib/constants';
import type { HelpRequest } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface RequestCardProps {
    request: HelpRequest;
    onAccept?: () => void;
    onPress?: () => void;
    showAcceptButton?: boolean;
}

export function RequestCard({ request, onAccept, onPress, showAcceptButton = false }: RequestCardProps) {
    const helpType = HELP_TYPES.find((h) => h.id === request.type);
    const distanceText = request.distance_meters
        ? request.distance_meters < 1000
            ? `${Math.round(request.distance_meters)}m away`
            : `${(request.distance_meters / 1000).toFixed(1)}km away`
        : 'Nearby';

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.85 : 1}>
            <Card elevated style={styles.card}>
                {/* Header row */}
                <View style={styles.header}>
                    <View style={styles.typeRow}>
                        <Text style={styles.emoji}>{helpType?.icon ?? '🤝'}</Text>
                        <Text style={styles.typeLabel}>{helpType?.label ?? 'Help'}</Text>
                    </View>
                    <Badge
                        label={request.urgency}
                        variant={request.urgency === 'Urgent' ? 'urgency-urgent' : 'urgency-normal'}
                    />
                </View>

                {/* Note */}
                {request.note ? (
                    <Text style={styles.note} numberOfLines={2}>{request.note}</Text>
                ) : null}

                {/* Footer row */}
                <View style={styles.footer}>
                    <Badge label={distanceText} variant="distance" />
                    <Badge label={`${request.time_needed} min`} variant="time" />
                </View>

                {/* Accept button */}
                {showAcceptButton && (
                    <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} activeOpacity={0.85}>
                        <Text style={styles.acceptText}>Accept Request</Text>
                    </TouchableOpacity>
                )}
            </Card>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: { marginBottom: 12 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    typeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    emoji: { fontSize: 24 },
    typeLabel: {
        fontSize: FontSizes.lg,
        fontWeight: '700',
        color: Colors.text,
    },
    note: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginBottom: 14,
        lineHeight: 20,
    },
    footer: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    acceptBtn: {
        marginTop: 16,
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    acceptText: {
        color: Colors.white,
        fontWeight: '700',
        fontSize: FontSizes.md,
    },
});
