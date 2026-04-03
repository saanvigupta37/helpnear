import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, FontSizes, HELP_TYPES } from '@/lib/constants';
import type { HelpTypeId } from '@/lib/constants';

interface HelpTypeGridProps {
    selected: HelpTypeId | null;
    onSelect: (id: HelpTypeId) => void;
}

export function HelpTypeGrid({ selected, onSelect }: HelpTypeGridProps) {
    return (
        <View style={styles.grid}>
            {HELP_TYPES.map((type) => {
                const isSelected = selected === type.id;
                return (
                    <TouchableOpacity
                        key={type.id}
                        style={[styles.cell, isSelected && styles.selectedCell]}
                        onPress={() => onSelect(type.id)}
                        activeOpacity={0.75}
                    >
                        <Text style={styles.emoji}>{type.icon}</Text>
                        <Text style={[styles.label, isSelected && styles.selectedLabel]}>
                            {type.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    cell: {
        width: '22%',
        aspectRatio: 1,
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        gap: 4,
    },
    selectedCell: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '22',
    },
    emoji: { fontSize: 28 },
    label: {
        fontSize: FontSizes.xs,
        color: Colors.textSecondary,
        textAlign: 'center',
        fontWeight: '600',
    },
    selectedLabel: { color: Colors.primaryLight },
});
