import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { colors } from '../theme/colors';

export function BackHeader({
  title, subtitle, onBack, right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack ?? (() => navigation.goBack())}
          hitSlop={8}
        >
          <Feather name="chevron-left" size={17} color={colors.textSecondary} />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
        {right}
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 14, color: colors.textSecondary },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginTop: 10 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
