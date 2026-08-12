import React from 'react';
import { Text, TextStyle, StyleProp, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight } from '../../constants/theme';

interface LabelProps {
  children: React.ReactNode;
  variant?: 'display' | 'title' | 'heading' | 'body' | 'caption' | 'micro';
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

export function Label({ children, variant = 'body', color, style, numberOfLines }: LabelProps) {
  return (
    <Text style={[styles.base, styles[variant], color ? { color } : null, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: Colors.text,
  },
  display: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.bold,
    letterSpacing: -1,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
  },
  heading: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.regular,
    lineHeight: 22,
  },
  caption: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  micro: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
