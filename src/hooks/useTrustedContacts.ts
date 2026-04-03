import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface TrustedContact {
    id: string;
    user_id: string;
    name: string;
    phone_number: string;
    created_at: string;
}

export function useTrustedContacts() {
    const { user } = useAuth();
    const [contacts, setContacts] = useState<TrustedContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchContacts = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error: err } = await supabase
            .from('trusted_contacts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

        if (err) setError(err.message);
        else setContacts((data as TrustedContact[]) ?? []);
        setLoading(false);
    }, [user]);

    const addContact = useCallback(async (name: string, phoneNumber: string): Promise<boolean> => {
        if (!user) return false;
        const { error: err } = await supabase.from('trusted_contacts').insert({
            user_id: user.id,
            name: name.trim(),
            phone_number: phoneNumber.trim(),
        });
        if (err) { setError(err.message); return false; }
        await fetchContacts();
        return true;
    }, [user, fetchContacts]);

    const removeContact = useCallback(async (id: string): Promise<void> => {
        await supabase.from('trusted_contacts').delete().eq('id', id);
        setContacts((prev) => prev.filter((c) => c.id !== id));
    }, []);

    useEffect(() => { fetchContacts(); }, [fetchContacts]);

    return { contacts, loading, error, addContact, removeContact, refetch: fetchContacts };
}
