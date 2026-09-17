import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export function SelectableChip({
  label, selected, onPress, selectedColor,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  selectedColor?: string;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected && [styles.chipSelected, { backgroundColor: selectedColor ?? colors.accent, borderColor: selectedColor ?? colors.accent }],
      ]}
      onPress={onPress}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  text: { fontSize: 12.5, color: colors.textMuted, fontWeight: '600' },
  textSelected: { color: colors.white, fontWeight: '700' },
});
