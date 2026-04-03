import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Colors } from '@/lib/constants';

interface PanicButtonProps {
    onPress: () => void;
}

export function PanicButton({ onPress }: PanicButtonProps) {
    const pulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 1.15,
                    duration: 700,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 700,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [pulse]);

    return (
        <Animated.View style={[styles.wrapper, { transform: [{ scale: pulse }] }]}>
            <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
                <Text style={styles.icon}>🆘</Text>
                <Text style={styles.label}>PANIC</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: 90,
        right: 20,
        zIndex: 999,
        shadowColor: Colors.danger,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 16,
        elevation: 12,
    },
    button: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.danger,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    icon: { fontSize: 24 },
    label: {
        color: Colors.white,
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
    },
});
