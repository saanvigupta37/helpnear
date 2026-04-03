import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '@/lib/constants';

export function TypingIndicator() {
    const dots = [useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current];

    useEffect(() => {
        const animations = dots.map((dot, i) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(i * 160),
                    Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
                    Animated.delay((2 - i) * 160),
                ])
            )
        );
        animations.forEach((a) => a.start());
        return () => animations.forEach((a) => a.stop());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <View style={styles.wrapper}>
            <View style={styles.bubble}>
                {dots.map((dot, i) => (
                    <Animated.View
                        key={i}
                        style={[styles.dot, {
                            transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
                        }]}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { paddingHorizontal: 16, paddingVertical: 4, alignSelf: 'flex-start' },
    bubble: {
        flexDirection: 'row',
        gap: 4,
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    dot: {
        width: 7, height: 7,
        borderRadius: 3.5,
        backgroundColor: Colors.textMuted,
    },
});
