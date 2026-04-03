import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { useRating } from '@/hooks/useRating';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Colors, FontSizes } from '@/lib/constants';
import { Button } from '@/components/ui/Button';

interface RatingModalProps {
    visible: boolean;
    ratedUserId: string;
    ratedUserName: string;
    requestId: string;
    onDone: () => void;
}

export function RatingModal({ visible, ratedUserId, ratedUserName, requestId, onDone }: RatingModalProps) {
    const { submitRating, submitting } = useRating();
    const { logEvent } = useAnalytics();
    const [score, setScore] = useState(0);
    const [review, setReview] = useState('');

    const handleSubmit = async () => {
        if (!score) return;
        const ok = await submitRating({ ratedUserId, requestId, score, review });
        if (ok) {
            logEvent('rating_submitted', { rated_user_id: ratedUserId, score });
            onDone();
        }
    };

    const handleSkip = () => onDone();

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <Text style={styles.emoji}>⭐</Text>
                    <Text style={styles.title}>Rate your experience</Text>
                    <Text style={styles.subtitle}>
                        How was your session with{' '}
                        <Text style={styles.name}>{ratedUserName}</Text>?
                    </Text>

                    {/* Star selector */}
                    <View style={styles.stars}>
                        {[1, 2, 3, 4, 5].map((s) => (
                            <TouchableOpacity key={s} onPress={() => setScore(s)} activeOpacity={0.7}>
                                <Text style={[styles.star, score >= s && styles.starFilled]}>
                                    {score >= s ? '★' : '☆'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Optional review */}
                    <TextInput
                        style={styles.reviewInput}
                        placeholder="Leave an optional note (optional)"
                        placeholderTextColor={Colors.textMuted}
                        value={review}
                        onChangeText={setReview}
                        multiline
                        maxLength={200}
                    />

                    <View style={styles.actions}>
                        <Button
                            title={submitting ? 'Submitting...' : 'Submit Rating'}
                            onPress={handleSubmit}
                            loading={submitting}
                            disabled={!score}
                        />
                        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
                            <Text style={styles.skipText}>Skip for now</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: Colors.overlay,
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 28,
        paddingBottom: 44,
        alignItems: 'center',
        gap: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    emoji: { fontSize: 44 },
    title: { fontSize: FontSizes['2xl'], fontWeight: '800', color: Colors.text },
    subtitle: { fontSize: FontSizes.md, color: Colors.textSecondary, textAlign: 'center' },
    name: { color: Colors.primaryLight, fontWeight: '700' },
    stars: { flexDirection: 'row', gap: 8 },
    star: { fontSize: 40, color: Colors.textMuted },
    starFilled: { color: Colors.warning },
    reviewInput: {
        width: '100%',
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: FontSizes.md,
        color: Colors.text,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    actions: { width: '100%', gap: 10 },
    skipBtn: { alignItems: 'center', paddingVertical: 8 },
    skipText: { color: Colors.textMuted, fontSize: FontSizes.sm, fontWeight: '600' },
});
