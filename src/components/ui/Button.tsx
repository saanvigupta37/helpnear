import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    TouchableOpacityProps,
} from 'react-native';
import { Colors, FontSizes } from '@/lib/constants';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'danger' | 'outline' | 'ghost' | 'warning';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
}

export function Button({
    title,
    variant = 'primary',
    size = 'lg',
    loading = false,
    icon,
    fullWidth = true,
    style,
    disabled,
    ...props
}: ButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            style={[
                styles.base,
                styles[variant],
                styles[size],
                fullWidth && styles.fullWidth,
                isDisabled && styles.disabled,
                style as ViewStyle,
            ]}
            disabled={isDisabled}
            activeOpacity={0.8}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'outline' ? Colors.primary : Colors.white} size="small" />
            ) : (
                <>
                    {icon && <>{icon}</>}
                    <Text style={[styles.text, styles[`${variant}Text`] as TextStyle, styles[`${size}Text`] as TextStyle]}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        gap: 8,
    },
    fullWidth: { width: '100%' },
    disabled: { opacity: 0.5 },

    // Variants
    primary: { backgroundColor: Colors.primary },
    danger: { backgroundColor: Colors.danger },
    warning: { backgroundColor: Colors.warning },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    ghost: { backgroundColor: 'transparent' },

    // Sizes
    sm: { paddingHorizontal: 16, paddingVertical: 10, minHeight: 40 },
    md: { paddingHorizontal: 20, paddingVertical: 14, minHeight: 48 },
    lg: { paddingHorizontal: 24, paddingVertical: 18, minHeight: 60 },

    // Text base
    text: {
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    // Text by variant
    primaryText: { color: Colors.white },
    dangerText: { color: Colors.white },
    warningText: { color: Colors.background },
    outlineText: { color: Colors.primary },
    ghostText: { color: Colors.textSecondary },

    // Text by size
    smText: { fontSize: FontSizes.sm },
    mdText: { fontSize: FontSizes.md },
    lgText: { fontSize: FontSizes.lg },
});
