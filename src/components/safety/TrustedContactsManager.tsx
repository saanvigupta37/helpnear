import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useTrustedContacts } from '@/hooks/useTrustedContacts';
import { Colors, FontSizes } from '@/lib/constants';
import { Button } from '@/components/ui/Button';

export function TrustedContactsManager() {
    const { contacts, loading, addContact, removeContact } = useTrustedContacts();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [adding, setAdding] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const handleAdd = async () => {
        if (!name.trim() || !phone.trim()) {
            Alert.alert('Missing info', 'Please enter both name and phone number.');
            return;
        }
        setAdding(true);
        const ok = await addContact(name, phone);
        setAdding(false);
        if (ok) { setName(''); setPhone(''); setShowForm(false); }
    };

    const handleRemove = (id: string, contactName: string) => {
        Alert.alert('Remove Contact', `Remove ${contactName} from trusted contacts?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => removeContact(id) },
        ]);
    };

    return (
        <View style={styles.container}>
            <View style={styles.sectionHeader}>
                <Text style={styles.title}>🛡️ Trusted Contacts</Text>
                <TouchableOpacity onPress={() => setShowForm((v) => !v)} style={styles.addBtn}>
                    <Text style={styles.addBtnText}>{showForm ? '✕ Cancel' : '+ Add'}</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>
                These contacts receive SMS when you trigger a panic alert.
            </Text>

            {/* Add form */}
            {showForm && (
                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="Contact name"
                        placeholderTextColor={Colors.textMuted}
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="+91 98765 43210"
                        placeholderTextColor={Colors.textMuted}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />
                    <Button
                        title="Save Contact"
                        size="md"
                        onPress={handleAdd}
                        loading={adding}
                    />
                </View>
            )}

            {/* Contacts list */}
            {loading ? (
                <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />
            ) : contacts.length === 0 ? (
                <Text style={styles.emptyText}>No trusted contacts yet.</Text>
            ) : (
                <FlatList
                    data={contacts}
                    keyExtractor={(c) => c.id}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                        <View style={styles.contactRow}>
                            <View style={styles.contactAvatar}>
                                <Text style={styles.contactInitial}>
                                    {item.name[0].toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactName}>{item.name}</Text>
                                <Text style={styles.contactPhone}>{item.phone_number}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => handleRemove(item.id, item.name)}
                                style={styles.removeBtn}
                            >
                                <Text style={styles.removeBtnText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { gap: 12 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text },
    subtitle: { fontSize: FontSizes.xs, color: Colors.textMuted, lineHeight: 18, marginTop: -4 },
    addBtn: {
        backgroundColor: Colors.primary + '22',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    addBtnText: { color: Colors.primary, fontSize: FontSizes.sm, fontWeight: '700' },
    form: { gap: 10, backgroundColor: Colors.surfaceElevated, borderRadius: 14, padding: 16 },
    input: {
        backgroundColor: Colors.surface,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: FontSizes.md,
        color: Colors.text,
    },
    emptyText: { fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center', paddingVertical: 12 },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        gap: 12,
    },
    contactAvatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: Colors.primary + '33',
        alignItems: 'center', justifyContent: 'center',
    },
    contactInitial: { color: Colors.primary, fontWeight: '800', fontSize: FontSizes.lg },
    contactInfo: { flex: 1 },
    contactName: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text },
    contactPhone: { fontSize: FontSizes.sm, color: Colors.textSecondary },
    removeBtn: { padding: 8 },
    removeBtnText: { color: Colors.danger, fontSize: FontSizes.md, fontWeight: '700' },
});
