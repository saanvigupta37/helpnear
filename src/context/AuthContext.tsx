import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/lib/types';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
    refreshProfile: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // ── Fetch profile from users table ───────────────────────
    const fetchProfile = async (userId: string) => {
        const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        if (data) setProfile(data as UserProfile);
    };

    // ── Ensure a row exists in users table for this auth user ─
    const ensureUserRow = async (userId: string, email?: string) => {
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('id', userId)
            .maybeSingle();

        if (!existing) {
            // First time sign-in — create the profile row
            await supabase.from('users').upsert([
                {
                    id: userId,
                    name: email?.split('@')[0] ?? 'User',
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
        }
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                ensureUserRow(session.user.id, session.user.email ?? undefined)
                    .then(() => fetchProfile(session.user.id));
            }
            setLoading(false);
        });

        // Listen for auth state changes (login / logout / token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setSession(session);
                if (session?.user) {
                    await ensureUserRow(session.user.id, session.user.email ?? undefined);
                    await fetchProfile(session.user.id);
                } else {
                    setProfile(null);
                }
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
    };

    const refreshProfile = async () => {
        if (session?.user?.id) await fetchProfile(session.user.id);
    };

    return (
        <AuthContext.Provider
            value={{ session, user: session?.user ?? null, profile, loading, signOut, refreshProfile }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
