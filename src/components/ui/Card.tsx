import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/lib/constants';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    elevated?: boolean;
    padded?: boolean;
}

export function Card({ children, style, elevated = false, padded = true }: CardProps) {
    return (
        <View style={[styles.card, elevated && styles.elevated, padded && styles.padded, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    elevated: {
        backgroundColor: Colors.surfaceElevated,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    padded: {
        padding: 20,
    },
});
