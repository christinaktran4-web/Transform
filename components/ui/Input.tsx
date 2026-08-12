import React from 'react';
import { TextInput, View, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { Label } from './Label';

interface InputProps extends TextInputProps {
  label?: string;
  containerStyle?: ViewStyle;
  multiline?: boolean;
}

export function Input({ label, containerStyle, multiline, style, ...props }: InputProps) {
  return (
    <View style={containerStyle}>
      {label && <Label variant="micro" style={styles.label}>{label}</Label>}
      <TextInput
        {...props}
        multiline={multiline}
        style={[styles.input, multiline && styles.multiline, style]}
        placeholderTextColor={Colors.textTertiary}
        keyboardAppearance="dark"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  multiline: {
    paddingTop: Spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
