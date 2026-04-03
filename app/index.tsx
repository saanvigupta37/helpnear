import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSizes } from '@/lib/constants';

export default function SplashScreen() {
    const scale = useRef(new Animated.Value(0.7)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const taglineOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.parallel([
                Animated.timing(scale, {
                    toValue: 1,
                    duration: 700,
                    easing: Easing.out(Easing.back(1.2)),
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
            Animated.delay(200),
            Animated.timing(taglineOpacity, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, [scale, opacity, taglineOpacity]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.content}>
                <Animated.View style={[styles.logoWrapper, { transform: [{ scale }], opacity }]}>
                    <Text style={styles.emoji}>🤝</Text>
                    <Text style={styles.wordmark}>HelpNear</Text>
                </Animated.View>
                <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
                    Fast. Local. Human.
                </Animated.Text>
            </View>
            <Animated.Text style={[styles.version, { opacity: taglineOpacity }]}>
                v1.0.0 MVP
            </Animated.Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        gap: 16,
    },
    logoWrapper: {
        alignItems: 'center',
        gap: 12,
    },
    emoji: { fontSize: 80 },
    wordmark: {
        fontSize: FontSizes['3xl'],
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: -1,
    },
    tagline: {
        fontSize: FontSizes.lg,
        color: Colors.textSecondary,
        letterSpacing: 2,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    version: {
        position: 'absolute',
        bottom: 40,
        fontSize: FontSizes.xs,
        color: Colors.textMuted,
    },
});
