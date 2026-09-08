import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import {
  PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH,
  PASSWORD_UPPERCASE_REGEX, PASSWORD_DIGIT_REGEX, PASSWORD_SYMBOL_REGEX,
} from '../../utils/password';

export function AlterarSenhaScreen() {
  const navigation = useNavigation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

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
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Alterar senha</Text>

        <Text style={styles.label}>Senha atual</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!showCurrent}
            placeholder="••••••••"
            placeholderTextColor="#9E9E9E"
            autoFocus
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCurrent(!showCurrent)}>
            <Text style={styles.eyeIcon}>{showCurrent ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Nova senha</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNew}
            placeholder="Mínimo 8 caracteres"
            placeholderTextColor="#9E9E9E"
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNew(!showNew)}>
            <Text style={styles.eyeIcon}>{showNew ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirmar nova senha</Text>
        <TextInput
          style={[styles.inputStandalone, confirm !== '' && newPassword !== confirm && styles.inputError]}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry={!showNew}
          placeholder="Repita a nova senha"
          placeholderTextColor="#9E9E9E"
        />
        {confirm !== '' && newPassword !== confirm && (
          <Text style={styles.errorMsg}>As senhas não coincidem</Text>
        )}

        {/* Requisitos */}
        <View style={styles.requirements}>
          <Text style={[styles.req, newPassword.length >= PASSWORD_MIN_LENGTH && styles.reqOk]}>
            {newPassword.length >= PASSWORD_MIN_LENGTH ? '✅' : '○'} Mínimo {PASSWORD_MIN_LENGTH} caracteres
          </Text>
          <Text style={[styles.req, PASSWORD_UPPERCASE_REGEX.test(newPassword) && styles.reqOk]}>
            {PASSWORD_UPPERCASE_REGEX.test(newPassword) ? '✅' : '○'} Uma letra maiúscula
          </Text>
          <Text style={[styles.req, PASSWORD_DIGIT_REGEX.test(newPassword) && styles.reqOk]}>
            {PASSWORD_DIGIT_REGEX.test(newPassword) ? '✅' : '○'} Um número
          </Text>
          <Text style={[styles.req, PASSWORD_SYMBOL_REGEX.test(newPassword) && styles.reqOk]}>
            {PASSWORD_SYMBOL_REGEX.test(newPassword) ? '✅' : '○'} Um símbolo
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#FFF" />
            : <Text style={styles.btnText}>Alterar senha</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F5F5F5', padding: 24, paddingTop: 56 },
  backBtn: { marginBottom: 20 },
  backText: { color: '#1B5E20', fontSize: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1B5E20', marginBottom: 32 },
  label: { fontSize: 13, fontWeight: '600', color: '#424242', marginBottom: 8, marginTop: 12 },
  inputRow: { position: 'relative', marginBottom: 4 },
  input: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12, paddingRight: 48,
    fontSize: 16, color: '#212121',
  },
  inputStandalone: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#212121', marginBottom: 4,
  },
  inputError: { borderColor: '#E53935' },
  eyeBtn: { position: 'absolute', right: 12, top: 12 },
  eyeIcon: { fontSize: 20 },
  errorMsg: { color: '#E53935', fontSize: 12, marginBottom: 4 },
  requirements: { backgroundColor: '#F1F8E9', borderRadius: 8, padding: 12, marginTop: 16, marginBottom: 24 },
  req: { fontSize: 13, color: '#9E9E9E', marginBottom: 4 },
  reqOk: { color: '#2E7D32' },
  btn: { backgroundColor: '#1B5E20', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
