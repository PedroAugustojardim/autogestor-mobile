import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useExpenseStore } from '../../store/expenseStore';
import { GastosStackParamList } from '../../types/navigation';
import { FormField } from '../../components/FormField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';

type RouteProps = RouteProp<GastosStackParamList, 'EditExpense'>;

export function EditExpenseScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { expense, vehicleId } = route.params;

  const { updateExpense, deleteExpense, fetchSummary } = useExpenseStore();
  const [valor, setValor] = useState(Number(expense.valor).toFixed(2));
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
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={17} color={colors.textSecondary} />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>{expense.category?.icone ?? '📦'}</Text>
          </View>
          <View>
            <Text style={styles.title}>{expense.category?.nome ?? 'Gasto'}</Text>
            <Text style={styles.subtitle}>Editar lançamento</Text>
          </View>
        </View>

        <View style={styles.form}>
          <FormField label="Valor (R$)" required keyboardType="decimal-pad" value={valor} onChangeText={setValor} />
          <FormField label="Data" required placeholder="AAAA-MM-DD" value={data} onChangeText={setData} />
          <FormField label="KM atual" optional placeholder="Ex: 52000" keyboardType="number-pad" value={km} onChangeText={setKm} />
          <FormField label="Observação" optional multiline style={{ height: 80 }} textAlignVertical="top" value={descricao} onChangeText={setDescricao} />

          <PrimaryButton label="Salvar alterações" onPress={handleSave} loading={loading} />
          <PrimaryButton label="Excluir este gasto" variant="danger" icon="trash-2" onPress={handleDelete} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.bg, paddingHorizontal: 16, paddingTop: 30, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  backText: { fontSize: 14, color: colors.textSecondary },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  iconWrap: { width: 44, height: 44, borderRadius: 13, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
  title: { fontSize: 19, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 12.5, color: colors.textSecondary },
  form: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, gap: 12 },
});
