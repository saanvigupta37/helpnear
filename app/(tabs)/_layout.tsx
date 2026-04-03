import React from 'react';
import { Tabs } from 'expo-router';
import { Text, StyleSheet, View } from 'react-native';
import { Colors } from '@/lib/constants';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
    return (
        <View style={[styles.iconWrapper, focused && styles.iconFocused]}>
            <Text style={styles.emoji}>{emoji}</Text>
        </View>
    );
}

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textMuted,
                tabBarLabelStyle: styles.label,
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="nearby"
                options={{
                    title: 'Nearby',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="📍" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: Colors.surface,
        borderTopColor: Colors.border,
        borderTopWidth: 1,
        height: 76,
        paddingBottom: 16,
        paddingTop: 8,
    },
    label: { fontSize: 11, fontWeight: '600' },
    iconWrapper: {
        width: 40,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
    },
    iconFocused: { backgroundColor: Colors.primary + '22' },
    emoji: { fontSize: 22 },
});
