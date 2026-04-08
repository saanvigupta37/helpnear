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
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Colors, FontSizes } from '@/lib/constants';

type Mode = 'login' | 'signup';

export default function LoginScreen() {
    const [mode, setMode] = useState<Mode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail || !password) {
            Alert.alert('Missing fields', 'Please enter your email and password.');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
        });
        setLoading(false);

        if (error) {
            Alert.alert('Login failed', error.message);
        }
        // On success, AuthContext's onAuthStateChange fires → _layout.tsx redirects to home
    };

    const handleSignUp = async () => {
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedName = name.trim();

        if (!trimmedEmail || !password) {
            Alert.alert('Missing fields', 'Please enter your email and password.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Weak password', 'Password must be at least 6 characters.');
            return;
        }

        setLoading(true);

        // 1. Create auth user
        const { data, error } = await supabase.auth.signUp({
            email: trimmedEmail,
            password,
        });

        if (error || !data.user) {
            setLoading(false);
            Alert.alert('Sign-up failed', error?.message ?? 'Unknown error');
            return;
        }

        // 2. Upsert profile row into users table
        await supabase.from('users').upsert([
            {
                id: data.user.id,
                name: trimmedName || trimmedEmail.split('@')[0],
                phone: '',
                verified: false,
                is_verified: false,
                helps_completed: 0,
                avg_rating: 0,
                trust_score: 0,
                points: 0,
                badges: [],
            },
        ]);

        setLoading(false);
        // AuthContext will pick up the new session automatically
    };

    const isLogin = mode === 'login';

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.inner}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.emoji}>🤝</Text>
                        <Text style={styles.title}>
                            {isLogin ? 'Welcome back' : 'Join HelpNear'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {isLogin
                                ? 'Sign in to connect with people nearby.'
                                : 'Create an account and start helping today.'}
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        {/* Name – only for sign-up */}
                        {!isLogin && (
                            <View style={styles.field}>
                                <Text style={styles.label}>Your name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="e.g. Rahul"
                                    placeholderTextColor={Colors.textMuted}
                                    autoCapitalize="words"
                                    returnKeyType="next"
                                />
                            </View>
                        )}

                        {/* Email */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Email address</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="you@example.com"
                                placeholderTextColor={Colors.textMuted}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="next"
                            />
                        </View>

                        {/* Password */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                                placeholder={isLogin ? '••••••••' : 'At least 6 characters'}
                                placeholderTextColor={Colors.textMuted}
                                secureTextEntry
                                returnKeyType="done"
                                onSubmitEditing={isLogin ? handleLogin : handleSignUp}
                            />
                        </View>

                        <Button
                            title={isLogin ? 'Sign In →' : 'Create Account →'}
                            onPress={isLogin ? handleLogin : handleSignUp}
                            loading={loading}
                            style={styles.button}
                        />
                    </View>

                    {/* Mode switcher */}
                    <View style={styles.switchRow}>
                        <Text style={styles.switchText}>
                            {isLogin ? "Don't have an account? " : 'Already have an account? '}
                        </Text>
                        <TouchableOpacity
                            onPress={() => {
                                setMode(isLogin ? 'signup' : 'login');
                                setEmail('');
                                setPassword('');
                                setName('');
                            }}
                        >
                            <Text style={styles.switchLink}>
                                {isLogin ? 'Sign up' : 'Sign in'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.footer}>
                        By continuing, you agree to our Terms &amp; Privacy Policy.
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    inner: { flex: 1 },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingVertical: 32,
        justifyContent: 'center',
        gap: 32,
    },
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
    form: { gap: 16 },
    field: { gap: 6 },
    label: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textSecondary },
    input: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: Colors.border,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: FontSizes.md,
        color: Colors.text,
        fontWeight: '500',
    },
    button: { marginTop: 4 },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    switchText: { fontSize: FontSizes.sm, color: Colors.textSecondary },
    switchLink: {
        fontSize: FontSizes.sm,
        color: Colors.primary,
        fontWeight: '700',
    },
    footer: {
        fontSize: FontSizes.xs,
        color: Colors.textMuted,
        textAlign: 'center',
        lineHeight: 18,
    },
});
