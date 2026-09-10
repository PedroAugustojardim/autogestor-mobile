import React, { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';
import { useExpenseStore } from '../../store/expenseStore';
import { useVehicleStore } from '../../store/vehicleStore';
import { Expense } from '../../types/expense';
import { GastosStackParamList } from '../../types/navigation';
import { formatDateBR as formatDate } from '../../utils/date';
import { formatCurrencyBRL as formatCurrency } from '../../utils/currency';
import { colors } from '../../theme/colors';

type Nav = NativeStackNavigationProp<GastosStackParamList>;

function ExpenseItem({ item, vehicleId, onDelete }: { item: Expense; vehicleId: number; onDelete: (id: number) => void }) {
  const navigation = useNavigation<Nav>();
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('EditExpense', { expense: item, vehicleId })}
    >
      <View style={styles.cardLeft}>
        <View style={styles.cardIconWrap}>
          <Text style={styles.cardIcon}>{item.category?.icone ?? '📦'}</Text>
        </View>
        <View>
          <Text style={styles.cardCategoria}>{item.category?.nome ?? '—'}</Text>
          {item.descricao ? <Text style={styles.cardDesc} numberOfLines={1}>{item.descricao}</Text> : null}
          <Text style={styles.cardData}>{formatDate(item.data)}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardValor}>{formatCurrency(item.valor)}</Text>
        <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={8}>
          <Feather name="trash-2" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export function GastosScreen() {
  const navigation = useNavigation<Nav>();
  const { activeVehicle } = useVehicleStore();
  const { expenses, summary, isLoading, currentMes, currentAno, fetchExpenses, fetchSummary, deleteExpense, setMonth } = useExpenseStore();

  const load = useCallback(() => {
    if (!activeVehicle) return;
    fetchExpenses(activeVehicle.id);
    fetchSummary(activeVehicle.id);
  }, [activeVehicle, currentMes, currentAno]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (expId: number) => {
    Alert.alert('Excluir gasto', 'Tem certeza que deseja excluir este gasto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          if (!activeVehicle) return;
          await deleteExpense(activeVehicle.id, expId);
          fetchSummary(activeVehicle.id);
        },
      },
    ]);
  };

  const changeMonth = (delta: number) => {
    let m = currentMes + delta;
    let a = currentAno;
    if (m < 1) { m = 12; a--; }
    if (m > 12) { m = 1; a++; }
    setMonth(m, a);
  };

  const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  if (!activeVehicle) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Nenhum veículo cadastrado.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Seletor de mês */}
      <View style={styles.monthBar}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthArrow} hitSlop={8}>
          <Feather name="chevron-left" size={20} color={colors.textMuted} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{MONTHS[currentMes - 1]} {currentAno}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthArrow} hitSlop={8}>
          <Feather name="chevron-right" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Resumo do mês */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total do mês</Text>
        <Text style={styles.summaryTotal}>{formatCurrency(summary?.total ?? 0)}</Text>
        <Text style={styles.summaryCount}>{summary?.quantidade ?? 0} gasto(s)</Text>
      </View>

      {/* Lista */}
      {isLoading && expenses.length === 0 ? (
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(e) => String(e.id)}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={colors.accent} />}
          renderItem={({ item }) => (
            <ExpenseItem item={item} vehicleId={activeVehicle.id} onDelete={handleDelete} />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Nenhum gasto neste mês.</Text>
              <Text style={styles.emptyHint}>Toque em + para registrar</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* Botão flutuante + */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewExpense', { vehicleId: activeVehicle.id })}
      >
        <Feather name="plus" size={26} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  monthBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 22, paddingBottom: 10,
  },
  monthArrow: { padding: 6 },
  monthLabel: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  summaryCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    marginHorizontal: 16, marginBottom: 12, borderRadius: 18, padding: 20,
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 12.5, color: colors.textSecondary },
  summaryTotal: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, marginTop: 4 },
  summaryCount: { fontSize: 12, color: colors.textTertiary, marginTop: 4 },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    marginHorizontal: 16, marginBottom: 8,
    borderRadius: 14, padding: 14, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cardIconWrap: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  cardIcon: { fontSize: 18 },
  cardCategoria: { fontSize: 14.5, fontWeight: '600', color: colors.textPrimary },
  cardDesc: { fontSize: 12, color: colors.textSecondary, maxWidth: 180 },
  cardData: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 8 },
  cardValor: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  emptyText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center' },
  emptyHint: { fontSize: 13, color: colors.textTertiary, marginTop: 6 },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    backgroundColor: colors.accent, width: 56, height: 56,
    borderRadius: 28, alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
});
