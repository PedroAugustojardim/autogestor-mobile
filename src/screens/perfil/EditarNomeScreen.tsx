import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

export function EditarNomeScreen() {
  const navigation = useNavigation();
  const { user, restoreSession } = useAuthStore();
  const [nome, setNome] = useState(user?.name ?? '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const trimmed = nome.trim();
    if (!trimmed) { Alert.alert('Atenção', 'O nome não pode estar vazio'); return; }
    if (trimmed === user?.name) { navigation.goBack(); return; }

    setLoading(true);
    try {
      await api.put('/users/me', { name: trimmed });
      await restoreSession();
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.error ?? 'Não foi possível atualizar o nome');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Editar nome</Text>

        <Text style={styles.label}>Nome completo</Text>
        <TextInput
          style={styles.input}
          value={nome}
          onChangeText={setNome}
          placeholder="Seu nome"
          placeholderTextColor="#9E9E9E"
          autoFocus
          maxLength={100}
        />

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#FFF" />
            : <Text style={styles.btnText}>Salvar</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 24, paddingTop: 56 },
  backBtn: { marginBottom: 20 },
  backText: { color: '#1B5E20', fontSize: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1B5E20', marginBottom: 32 },
  label: { fontSize: 13, fontWeight: '600', color: '#424242', marginBottom: 8 },
  input: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0',
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, color: '#212121', marginBottom: 24,
  },
  btn: { backgroundColor: '#1B5E20', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
