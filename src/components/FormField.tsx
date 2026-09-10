import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { colors } from '../theme/colors';

export function FormField({
  label, required, optional, error, secureToggle, style, ...rest
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  secureToggle?: boolean;
} & TextInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
        {optional ? <Text style={styles.optional}> (opcional)</Text> : null}
      </Text>
      <View style={styles.fieldRow}>
        <TextInput
          style={[
            styles.input,
            secureToggle ? { paddingRight: 44 } : null,
            error ? styles.inputErrorBorder : null,
            style,
          ]}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={secureToggle ? !visible : rest.secureTextEntry}
          {...rest}
        />
        {secureToggle && (
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setVisible((v) => !v)} hitSlop={8}>
            <Feather name={visible ? 'eye-off' : 'eye'} size={17} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 12.5, fontWeight: '600', color: colors.textMuted },
  required: { color: colors.danger },
  optional: { fontWeight: '400', color: colors.textTertiary, fontSize: 11.5 },
  fieldRow: { position: 'relative', justifyContent: 'center' },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: colors.textPrimary,
  },
  inputErrorBorder: { borderColor: colors.danger },
  eyeBtn: { position: 'absolute', right: 14 },
  errorText: { fontSize: 12, color: colors.danger },
});
