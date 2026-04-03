import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Colors, FontSizes } from '@/lib/constants';

export default function PhoneScreen() {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async () => {
        const cleaned = phone.replace(/\s/g, '');
        if (cleaned.length < 10) {
            Alert.alert('Invalid number', 'Please enter a valid phone number with country code.');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({ phone: cleaned });
        setLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            router.push({ pathname: '/auth/otp', params: { phone: cleaned } });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.inner}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.emoji}>🤝</Text>
                    <Text style={styles.title}>Welcome to HelpNear</Text>
                    <Text style={styles.subtitle}>
                        Enter your phone number to get started. We'll send you a one-time code.
                    </Text>
                </View>

                {/* Input section */}
                <View style={styles.form}>
                    <Text style={styles.label}>Phone Number</Text>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.flag}>🌍</Text>
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="+91 98765 43210"
                            placeholderTextColor={Colors.textMuted}
                            keyboardType="phone-pad"
                            maxLength={16}
                            autoFocus
                        />
                    </View>
                    <Text style={styles.hint}>Include country code, e.g. +91 for India</Text>

                    <Button
                        title="Send OTP →"
                        onPress={handleSendOTP}
                        loading={loading}
                        style={styles.button}
                    />
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    By continuing, you agree to our Terms & Privacy Policy.
                </Text>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    inner: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', gap: 40 },
    header: { alignItems: 'center', gap: 12 },
    emoji: { fontSize: 56 },
    title: {
        fontSize: FontSizes['2xl'],
        fontWeight: '800',
        color: Colors.text,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    form: { gap: 12 },
    label: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textSecondary },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: Colors.border,
        paddingHorizontal: 16,
        gap: 10,
    },
    flag: { fontSize: 22 },
    input: {
        flex: 1,
        paddingVertical: 18,
        fontSize: FontSizes.xl,
        color: Colors.text,
        fontWeight: '600',
        letterSpacing: 1,
    },
    hint: { fontSize: FontSizes.xs, color: Colors.textMuted },
    button: { marginTop: 8 },
    footer: {
        fontSize: FontSizes.xs,
        color: Colors.textMuted,
        textAlign: 'center',
        lineHeight: 18,
    },
});
