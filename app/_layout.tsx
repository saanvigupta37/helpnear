import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LocationProvider } from '@/context/LocationContext';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { Colors } from '@/lib/constants';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
    initialRouteName: 'index',
};

function OfflineAwareWrapper({ children }: { children: React.ReactNode }) {
    const { isOnline, queueLength } = useOfflineQueue();
    return (
        <>
            {!isOnline && <OfflineBanner queueLength={queueLength} />}
            {children}
        </>
    );
}

function RootNavigator() {
    const { session, loading } = useAuth();

    useEffect(() => {
        if (loading) return;
        if (session) {
            router.replace('/(tabs)/home');
        } else {
            router.replace('/auth/phone');
        }
    }, [session, loading]);

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background },
                animation: 'fade',
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="auth/phone" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="request/new" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="request/[id]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen
                name="request/panic"
                options={{ animation: 'fade', presentation: 'fullScreenModal' }}
            />
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <AuthProvider>
                    <LocationProvider>
                        <OfflineAwareWrapper>
                            <StatusBar style="light" />
                            <RootNavigator />
                        </OfflineAwareWrapper>
                    </LocationProvider>
                </AuthProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
