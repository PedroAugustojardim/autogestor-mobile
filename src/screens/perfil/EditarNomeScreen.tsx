import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { FormField } from '../../components/FormField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';

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
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={17} color={colors.textSecondary} />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Editar nome</Text>

        <View style={styles.form}>
          <FormField label="Nome completo" placeholder="Seu nome" autoFocus maxLength={100} value={nome} onChangeText={setNome} />
          <PrimaryButton label="Salvar" onPress={handleSave} loading={loading} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 20, paddingTop: 30, gap: 6 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  backText: { fontSize: 14, color: colors.textSecondary },
  title: { fontSize: 21, fontWeight: '700', color: colors.textPrimary, marginBottom: 20 },
  form: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 18, gap: 14 },
});
