import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Colors, FontSizes, EMERGENCY_NUMBER } from '@/lib/constants';

export function SafetyBanner() {
    const callEmergency = () => {
        Linking.openURL(`tel:${EMERGENCY_NUMBER}`);
    };

    return (
        <View style={styles.banner}>
            <Text style={styles.icon}>🛡️</Text>
            <Text style={styles.text}>Safety mode active · Location shared</Text>
            <TouchableOpacity style={styles.callBtn} onPress={callEmergency} activeOpacity={0.8}>
                <Text style={styles.callText}>📞 {EMERGENCY_NUMBER}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.warning + '22',
        borderBottomWidth: 1,
        borderBottomColor: Colors.warning + '44',
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 8,
    },
    icon: { fontSize: 16 },
    text: {
        flex: 1,
        fontSize: FontSizes.xs,
        color: Colors.warning,
        fontWeight: '600',
    },
    callBtn: {
        backgroundColor: Colors.danger,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    callText: {
        color: Colors.white,
        fontSize: FontSizes.xs,
        fontWeight: '700',
    },
});
