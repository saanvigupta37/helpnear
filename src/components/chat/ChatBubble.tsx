import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes } from '@/lib/constants';
import type { Message } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

interface ChatBubbleProps {
    message: Message;
}

export function ChatBubble({ message }: ChatBubbleProps) {
    const { user } = useAuth();
    const isMine = message.sender_id === user?.id;

    const time = new Date(message.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <View style={[styles.wrapper, isMine ? styles.myWrapper : styles.theirWrapper]}>
            <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
                <Text style={[styles.text, isMine ? styles.myText : styles.theirText]}>
                    {message.message}
                </Text>
            </View>
            <Text style={styles.time}>{time}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { marginVertical: 4, maxWidth: '80%' },
    myWrapper: { alignSelf: 'flex-end', alignItems: 'flex-end' },
    theirWrapper: { alignSelf: 'flex-start', alignItems: 'flex-start' },
    bubble: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10 },
    myBubble: {
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 4,
    },
    theirBubble: {
        backgroundColor: Colors.surfaceElevated,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    text: { fontSize: FontSizes.md, lineHeight: 22 },
    myText: { color: Colors.white },
    theirText: { color: Colors.text },
    time: {
        fontSize: FontSizes.xs,
        color: Colors.textMuted,
        marginTop: 2,
        marginHorizontal: 4,
    },
});
