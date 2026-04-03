import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Colors, FontSizes } from '@/lib/constants';

const OTP_LENGTH = 6;

export default function OTPScreen() {
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [loading, setLoading] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(30);
    const inputRefs = useRef<(TextInput | null)[]>(Array(OTP_LENGTH).fill(null));

    useEffect(() => {
        if (resendCountdown <= 0) return;
        const timer = setInterval(() => setResendCountdown((c) => c - 1), 1000);
        return () => clearInterval(timer);
    }, [resendCountdown]);

    const handleChange = (text: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = text.slice(-1);
        setOtp(newOtp);
        if (text && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length < OTP_LENGTH) {
            Alert.alert('Incomplete', 'Please enter all 6 digits.');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.verifyOtp({
            phone: phone ?? '',
            token: code,
            type: 'sms',
        });
        setLoading(false);

        if (error) {
            Alert.alert('Invalid Code', error.message);
        } else {
            // Auth state change will handle redirect in _layout.tsx
        }
    };

    const handleResend = async () => {
        if (resendCountdown > 0) return;
        await supabase.auth.signInWithOtp({ phone: phone ?? '' });
        setResendCountdown(30);
        Alert.alert('Code Resent', 'A new OTP has been sent.');
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.inner}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Back */}
                <TouchableOpacity onPress={() => router.back()} style={styles.back}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.emoji}>📱</Text>
                    <Text style={styles.title}>Check your messages</Text>
                    <Text style={styles.subtitle}>
                        We sent a 6-digit code to{'\n'}
                        <Text style={styles.phone}>{phone}</Text>
                    </Text>
                </View>

                {/* OTP boxes */}
                <View style={styles.otpRow}>
                    {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                        <TextInput
                            key={i}
                            ref={(r) => { inputRefs.current[i] = r; }}
                            style={[styles.otpBox, otp[i] ? styles.otpBoxFilled : null]}
                            value={otp[i]}
                            onChangeText={(t) => handleChange(t, i)}
                            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                            keyboardType="number-pad"
                            maxLength={1}
                            selectTextOnFocus
                            autoFocus={i === 0}
                        />
                    ))}
                </View>

                <Button title="Verify →" onPress={handleVerify} loading={loading} />

                {/* Resend */}
                <TouchableOpacity onPress={handleResend} disabled={resendCountdown > 0}>
                    <Text style={[styles.resend, resendCountdown > 0 && styles.resendDisabled]}>
                        {resendCountdown > 0
                            ? `Resend code in ${resendCountdown}s`
                            : 'Resend code'}
                    </Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    inner: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', gap: 32 },
    back: { position: 'absolute', top: 16, left: 0 },
    backText: { color: Colors.primary, fontSize: FontSizes.md, fontWeight: '600' },
    header: { alignItems: 'center', gap: 12 },
    emoji: { fontSize: 56 },
    title: { fontSize: FontSizes['2xl'], fontWeight: '800', color: Colors.text },
    subtitle: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 26,
    },
    phone: { color: Colors.primaryLight, fontWeight: '700' },
    otpRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
    otpBox: {
        width: 48,
        height: 60,
        borderRadius: 14,
        backgroundColor: Colors.surface,
        borderWidth: 2,
        borderColor: Colors.border,
        textAlign: 'center',
        fontSize: FontSizes.xl,
        fontWeight: '700',
        color: Colors.text,
    },
    otpBoxFilled: { borderColor: Colors.primary },
    resend: {
        textAlign: 'center',
        fontSize: FontSizes.sm,
        color: Colors.primary,
        fontWeight: '600',
    },
    resendDisabled: { color: Colors.textMuted },
});
