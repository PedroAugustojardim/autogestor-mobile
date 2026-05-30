import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useExpenseStore } from '../../store/expenseStore';
import { GastosStackParamList } from '../../types/navigation';

type RouteProps = RouteProp<GastosStackParamList, 'EditExpense'>;

export function EditExpenseScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { expense, vehicleId } = route.params;

  const { updateExpense, deleteExpense, fetchSummary } = useExpenseStore();
  const [valor, setValor] = useState(String(Number(expense.valor).toFixed(2)));
  const [data, setData] = useState(expense.data);
  const [descricao, setDescricao] = useState(expense.descricao ?? '');
  const [km, setKm] = useState(expense.kmAtual ? String(expense.kmAtual) : '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!valor || Number(valor) <= 0) { Alert.alert('Atenção', 'Informe o valor'); return; }
    setLoading(true);
    try {
      await updateExpense(vehicleId, expense.id, {
        valor: Number(valor),
        data,
        descricao: descricao || undefined,
        kmAtual: km ? Number(km) : undefined,
      });
      await fetchSummary(vehicleId);
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o gasto');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Excluir gasto', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          await deleteExpense(vehicleId, expense.id);
          await fetchSummary(vehicleId);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.icon}>{expense.category?.icone ?? '📦'}</Text>
          <View>
            <Text style={styles.title}>{expense.category?.nome ?? 'Gasto'}</Text>
            <Text style={styles.subtitle}>Editar lançamento</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Valor (R$) *</Text>
          <TextInput style={styles.input} value={valor} onChangeText={setValor}
            keyboardType="decimal-pad" placeholderTextColor="#9E9E9E" />

          <Text style={styles.label}>Data *</Text>
          <TextInput style={styles.input} value={data} onChangeText={setData}
            placeholder="AAAA-MM-DD" placeholderTextColor="#9E9E9E" />

          <Text style={styles.label}>KM atual <Text style={styles.optional}>(opcional)</Text></Text>
          <TextInput style={styles.input} value={km} onChangeText={setKm}
            keyboardType="number-pad" placeholder="Ex: 52000" placeholderTextColor="#9E9E9E" />

          <Text style={styles.label}>Observação <Text style={styles.optional}>(opcional)</Text></Text>
          <TextInput style={[styles.input, { height: 80 }]} value={descricao} onChangeText={setDescricao}
            multiline textAlignVertical="top" placeholderTextColor="#9E9E9E" />

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Salvar alterações</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>🗑️ Excluir este gasto</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F5F5F5', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 40 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#1B5E20', fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  icon: { fontSize: 40 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1B5E20' },
  subtitle: { fontSize: 13, color: '#757575' },
  form: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, elevation: 1 },
  label: { fontSize: 13, fontWeight: '600', color: '#424242', marginBottom: 6, marginTop: 12 },
  optional: { fontWeight: '400', color: '#9E9E9E', fontSize: 11 },
  input: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#212121', backgroundColor: '#FAFAFA',
  },
  btn: { backgroundColor: '#1B5E20', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  deleteBtn: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
  deleteBtnText: { color: '#E53935', fontSize: 15, fontWeight: '600' },
});
