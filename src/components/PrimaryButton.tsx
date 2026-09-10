import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { colors } from '../theme/colors';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

export function PrimaryButton({
  label, onPress, loading, disabled, variant = 'primary', icon,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
  icon?: FeatherName;
}) {
  const isDisabled = disabled || loading;

  if (variant !== 'primary') {
    return (
      <TouchableOpacity onPress={onPress} disabled={isDisabled} style={styles.linkBtn}>
        {icon && <Feather name={icon} size={15} color={variant === 'danger' ? colors.danger : colors.accent} />}
        <Text style={[styles.linkText, variant === 'danger' && styles.dangerText, isDisabled && styles.disabledOpacity]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.disabledOpacity]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <>
          {icon && <Feather name={icon} size={16} color={colors.white} />}
          <Text style={styles.buttonText}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14,
  },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  linkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  linkText: { color: colors.accent, fontSize: 13.5, fontWeight: '600' },
  dangerText: { color: colors.danger },
  disabledOpacity: { opacity: 0.6 },
});
