import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Linking,
    Animated,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePanic } from '@/hooks/usePanic';
import { Colors, FontSizes, EMERGENCY_NUMBER } from '@/lib/constants';

export default function PanicScreen() {
    const { triggerPanic } = usePanic();
    const pulse = useRef(new Animated.Value(1)).current;

    // pulse isn't managed by useRef here because this is a modal-style screen
    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.08, duration: 600, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            {/* Close */}
            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.content}>
                {/* Main panic CTA */}
                <Animated.View style={{ transform: [{ scale: pulse }] }}>
                    <TouchableOpacity style={styles.panicBtn} onPress={triggerPanic} activeOpacity={0.8}>
                        <Text style={styles.panicIcon}>🆘</Text>
                        <Text style={styles.panicLabel}>SEND PANIC ALERT</Text>
                        <Text style={styles.panicSub}>Alerts contacts & shares your location</Text>
                    </TouchableOpacity>
                </Animated.View>

                <Text style={styles.orText}>— or —</Text>

                {/* Emergency call */}
                <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => Linking.openURL(`tel:${EMERGENCY_NUMBER}`)}
                    activeOpacity={0.85}
                >
                    <Text style={styles.callIcon}>📞</Text>
                    <View>
                        <Text style={styles.callLabel}>Call Emergency Services</Text>
                        <Text style={styles.callNumber}>{EMERGENCY_NUMBER}</Text>
                    </View>
                </TouchableOpacity>

                {/* Safety tips */}
                <View style={styles.tipsCard}>
                    <Text style={styles.tipsTitle}>🛡️ Stay Safe</Text>
                    <Text style={styles.tip}>• Stay in a visible, public area</Text>
                    <Text style={styles.tip}>• Keep moving toward crowded spots</Text>
                    <Text style={styles.tip}>• Your location is being shared</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1A0505' },
    closeBtn: {
        position: 'absolute',
        top: 60,
        right: 24,
        zIndex: 10,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeText: { color: Colors.white, fontSize: 18, fontWeight: '700' },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
        gap: 24,
    },
    panicBtn: {
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: Colors.danger,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 6,
        borderColor: Colors.dangerDark,
        shadowColor: Colors.danger,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 30,
        elevation: 20,
        gap: 6,
    },
    panicIcon: { fontSize: 60 },
    panicLabel: {
        fontSize: FontSizes.md,
        fontWeight: '900',
        color: Colors.white,
        letterSpacing: 1.5,
    },
    panicSub: {
        fontSize: FontSizes.xs,
        color: 'rgba(255,255,255,0.75)',
        textAlign: 'center',
    },
    orText: { color: Colors.textMuted, fontSize: FontSizes.sm, fontWeight: '600' },
    callBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 20,
        gap: 16,
        width: '100%',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    callIcon: { fontSize: 32 },
    callLabel: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text },
    callNumber: { fontSize: FontSizes.xl, fontWeight: '900', color: Colors.danger },
    tipsCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
        width: '100%',
        gap: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    tipsTitle: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text, marginBottom: 4 },
    tip: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 22 },
});
