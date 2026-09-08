import React, { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useExpenseStore } from '../../store/expenseStore';
import { useVehicleStore } from '../../store/vehicleStore';
import { Expense } from '../../types/expense';
import { GastosStackParamList } from '../../types/navigation';
import { formatDateBR as formatDate } from '../../utils/date';
import { formatCurrencyBRL as formatCurrency } from '../../utils/currency';

type Nav = NativeStackNavigationProp<GastosStackParamList>;

function ExpenseItem({ item, vehicleId, onDelete }: { item: Expense; vehicleId: number; onDelete: (id: number) => void }) {
  const navigation = useNavigation<Nav>();
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('EditExpense', { expense: item, vehicleId })}
    >
      <View style={styles.cardLeft}>
        <Text style={styles.cardIcon}>{item.category?.icone ?? '📦'}</Text>
        <View>
          <Text style={styles.cardCategoria}>{item.category?.nome ?? '—'}</Text>
          {item.descricao ? <Text style={styles.cardDesc} numberOfLines={1}>{item.descricao}</Text> : null}
          <Text style={styles.cardData}>{formatDate(item.data)}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardValor}>{formatCurrency(item.valor)}</Text>
        <TouchableOpacity onPress={() => onDelete(item.id)}>
          <Text style={styles.deleteBtn}>🗑️</Text>
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
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthArrow}>
          <Text style={styles.monthArrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{MONTHS[currentMes - 1]} {currentAno}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthArrow}>
          <Text style={styles.monthArrowText}>›</Text>
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
        <ActivityIndicator size="large" color="#1B5E20" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(e) => String(e.id)}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} />}
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
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  monthBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1B5E20', paddingHorizontal: 16, paddingVertical: 12,
  },
  monthArrow: { padding: 8 },
  monthArrowText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  monthLabel: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  summaryCard: {
    backgroundColor: '#FFF', margin: 12, borderRadius: 12, padding: 20,
    alignItems: 'center', elevation: 2,
  },
  summaryLabel: { fontSize: 13, color: '#757575' },
  summaryTotal: { fontSize: 32, fontWeight: 'bold', color: '#1B5E20', marginTop: 4 },
  summaryCount: { fontSize: 12, color: '#BDBDBD', marginTop: 4 },
  card: {
    backgroundColor: '#FFF', marginHorizontal: 12, marginBottom: 8,
    borderRadius: 10, padding: 14, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    elevation: 1,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cardIcon: { fontSize: 28 },
  cardCategoria: { fontSize: 15, fontWeight: '600', color: '#212121' },
  cardDesc: { fontSize: 12, color: '#757575', maxWidth: 180 },
  cardData: { fontSize: 11, color: '#BDBDBD', marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  cardValor: { fontSize: 16, fontWeight: 'bold', color: '#1B5E20' },
  deleteBtn: { fontSize: 18 },
  emptyText: { fontSize: 16, color: '#757575', textAlign: 'center' },
  emptyHint: { fontSize: 13, color: '#BDBDBD', marginTop: 6 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    backgroundColor: '#1B5E20', width: 56, height: 56,
    borderRadius: 28, alignItems: 'center', justifyContent: 'center',
    elevation: 6,
  },
  fabText: { color: '#FFF', fontSize: 32, lineHeight: 36 },
});
