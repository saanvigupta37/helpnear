/**
 * OTP screen is no longer used — the app now uses email/password auth.
 * This file exists only to prevent "route not found" errors from stale
 * navigation state. It immediately redirects back to the login screen.
 */
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function OTPScreen() {
    useEffect(() => {
        router.replace('/auth/phone');
    }, []);

    return null;
}
