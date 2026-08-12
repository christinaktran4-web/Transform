import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../../constants/theme';
import { Label } from './Label';

function labelStyle(variant: string, size: string): TextStyle[] {
  const variantColors: Record<string, TextStyle> = {
    primary: { color: Colors.background },
    secondary: { color: Colors.text },
    ghost: { color: Colors.text },
    destructive: { color: Colors.text },
  };
  const sizeStyles: Record<string, TextStyle> = {
    sm: { fontSize: FontSize.sm },
    md: { fontSize: FontSize.md },
    lg: { fontSize: FontSize.lg },
  };
  return [{ fontWeight: FontWeight.semibold }, variantColors[variant] ?? {}, sizeStyles[size] ?? {}];
}

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  style,
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}` as keyof typeof styles] as ViewStyle,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.background : Colors.text} size="small" />
      ) : (
        <Label style={labelStyle(variant, size)}>
          {label}
        </Label>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  primary: {
    backgroundColor: Colors.text,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  destructive: {
    backgroundColor: Colors.destructive,
  },
  size_sm: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md },
  size_md: { paddingVertical: 13, paddingHorizontal: Spacing.xl },
  size_lg: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl },
  disabled: { opacity: 0.4 },
});
