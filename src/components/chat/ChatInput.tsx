import React, { useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Colors, FontSizes } from '@/lib/constants';

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
    onTypingStart?: () => void;
    onTypingStop?: () => void;
}

export function ChatInput({ onSend, disabled = false, onTypingStart, onTypingStop }: ChatInputProps) {
    const [text, setText] = useState('');

    const handleChangeText = (value: string) => {
        setText(value);
        if (value.length > 0) {
            onTypingStart?.();
        } else {
            onTypingStop?.();
        }
    };

    const handleSend = () => {
        if (!text.trim()) return;
        onSend(text.trim());
        setText('');
        onTypingStop?.();
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={90}
        >
            <View style={styles.container}>
                <TextInput
                    style={styles.input}
                    value={text}
                    onChangeText={handleChangeText}
                    placeholder="Type a message..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    maxLength={500}
                    editable={!disabled}
                    returnKeyType="send"
                    onSubmitEditing={handleSend}
                    onBlur={onTypingStop}
                />
                <TouchableOpacity
                    style={[styles.sendBtn, (!text.trim() || disabled) && styles.sendBtnDisabled]}
                    onPress={handleSend}
                    disabled={!text.trim() || disabled}
                    activeOpacity={0.8}
                >
                    <Text style={styles.sendIcon}>↑</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    input: {
        flex: 1,
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: FontSizes.md,
        color: Colors.text,
        maxHeight: 120,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    sendBtn: {
        width: 46, height: 46, borderRadius: 23,
        backgroundColor: Colors.primary,
        alignItems: 'center', justifyContent: 'center',
    },
    sendBtnDisabled: { backgroundColor: Colors.textMuted },
    sendIcon: { color: Colors.white, fontSize: 20, fontWeight: '800' },
});
