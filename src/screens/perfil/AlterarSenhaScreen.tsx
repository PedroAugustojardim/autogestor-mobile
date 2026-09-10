import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import api from '../../services/api';
import {
  PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH,
  PASSWORD_UPPERCASE_REGEX, PASSWORD_DIGIT_REGEX, PASSWORD_SYMBOL_REGEX,
} from '../../utils/password';
import { FormField } from '../../components/FormField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';

function Requirement({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={styles.reqRow}>
      {ok
        ? <Feather name="check-circle" size={15} color={colors.success} />
        : <View style={styles.reqCircle} />}
      <Text style={[styles.reqText, ok && styles.reqTextOk]}>{label}</Text>
    </View>
  );
}

export function AlterarSenhaScreen() {
  const navigation = useNavigation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!currentPassword) { Alert.alert('Atenção', 'Informe a senha atual'); return; }
    if (newPassword.length < PASSWORD_MIN_LENGTH) { Alert.alert('Atenção', `A nova senha deve ter no mínimo ${PASSWORD_MIN_LENGTH} caracteres`); return; }
    if (newPassword.length > PASSWORD_MAX_LENGTH) { Alert.alert('Atenção', `A nova senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres`); return; }
    if (!PASSWORD_UPPERCASE_REGEX.test(newPassword)) { Alert.alert('Atenção', 'A nova senha precisa de uma letra maiúscula'); return; }
    if (!PASSWORD_DIGIT_REGEX.test(newPassword)) { Alert.alert('Atenção', 'A nova senha precisa de um número'); return; }
    if (!PASSWORD_SYMBOL_REGEX.test(newPassword)) { Alert.alert('Atenção', 'A nova senha precisa de um símbolo'); return; }
    if (newPassword !== confirm) { Alert.alert('Atenção', 'As senhas não coincidem'); return; }
    if (newPassword === currentPassword) { Alert.alert('Atenção', 'A nova senha deve ser diferente da atual'); return; }

    setLoading(true);
    try {
      await api.put('/users/me/password', { currentPassword, newPassword });
      Alert.alert('Sucesso', 'Senha alterada com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.error ?? 'Não foi possível alterar a senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={17} color={colors.textSecondary} />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Alterar senha</Text>

        <View style={styles.form}>
          <FormField label="Senha atual" placeholder="••••••••" secureToggle autoFocus value={currentPassword} onChangeText={setCurrentPassword} />
          <FormField label="Nova senha" placeholder="Mínimo 8 caracteres" secureToggle value={newPassword} onChangeText={setNewPassword} />
          <FormField
            label="Confirmar nova senha"
            placeholder="Repita a nova senha"
            secureToggle
            value={confirm}
            onChangeText={setConfirm}
            error={confirm !== '' && newPassword !== confirm ? 'As senhas não coincidem' : undefined}
          />

          <View style={styles.requirements}>
            <Requirement ok={newPassword.length >= PASSWORD_MIN_LENGTH} label={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`} />
            <Requirement ok={PASSWORD_UPPERCASE_REGEX.test(newPassword)} label="Uma letra maiúscula" />
            <Requirement ok={PASSWORD_DIGIT_REGEX.test(newPassword)} label="Um número" />
            <Requirement ok={PASSWORD_SYMBOL_REGEX.test(newPassword)} label="Um símbolo" />
          </View>

          <PrimaryButton label="Alterar senha" onPress={handleSave} loading={loading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.bg, padding: 20, paddingTop: 30, gap: 6 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  backText: { fontSize: 14, color: colors.textSecondary },
  title: { fontSize: 21, fontWeight: '700', color: colors.textPrimary, marginBottom: 20 },
  form: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 18, gap: 14 },
  requirements: { backgroundColor: colors.successSoftBg, borderRadius: 12, padding: 14, gap: 8 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reqCircle: { width: 15, height: 15, borderRadius: 8, borderWidth: 1.8, borderColor: colors.textTertiary },
  reqText: { fontSize: 12.5, color: colors.textSecondary },
  reqTextOk: { color: colors.success, fontWeight: '600' },
});
