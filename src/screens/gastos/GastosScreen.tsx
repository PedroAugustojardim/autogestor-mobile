import React, { useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, SectionList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';
import { useExpenseStore } from '../../store/expenseStore';
import { useVehicleStore } from '../../store/vehicleStore';
import { Expense } from '../../types/expense';
import { GastosStackParamList } from '../../types/navigation';
import { formatDayGroupLabel } from '../../utils/date';
import { formatCurrencyBRL as formatCurrency } from '../../utils/currency';
import { colors } from '../../theme/colors';

type Nav = NativeStackNavigationProp<GastosStackParamList>;

// Cores usadas na barra de composição por categoria do resumo do mês — cicla pelos
// tokens já existentes na paleta (não há paleta dedicada por categoria).
const BREAKDOWN_COLORS = [colors.accent, colors.warning, colors.textTertiary];

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

  // Composição por categoria do resumo do mês — top 2 categorias + "Outros" com o resto,
  // pra caber na barra de 3 segmentos (mesmo espírito do gráfico de Relatórios).
  const categoryBreakdown = useMemo(() => {
    if (!summary || summary.porCategoria.length === 0) return [];
    const sorted = [...summary.porCategoria].sort((a, b) => b.total - a.total);
    const items = sorted.slice(0, 2).map((c) => ({ nome: c.nome, total: c.total }));
    const outrosTotal = sorted.slice(2).reduce((s, c) => s + c.total, 0);
    if (outrosTotal > 0) items.push({ nome: 'Outros', total: outrosTotal });
    return items;
  }, [summary]);

  // Agrupa os gastos do mês por dia (Hoje / Ontem / "D DE MÊS"), preservando a ordem
  // em que a API já devolve a lista.
  const sections = useMemo(() => {
    const groups: { title: string; data: Expense[] }[] = [];
    const indexByTitle = new Map<string, number>();
    for (const exp of expenses) {
      const title = formatDayGroupLabel(exp.data);
      let idx = indexByTitle.get(title);
      if (idx === undefined) {
        idx = groups.length;
        indexByTitle.set(title, idx);
        groups.push({ title, data: [] });
      }
      groups[idx].data.push(exp);
    }
    return groups;
  }, [expenses]);

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
        {categoryBreakdown.length > 0 && (
          <>
            <View style={styles.breakdownBar}>
              {categoryBreakdown.map((c, i) => (
                <View key={c.nome} style={{ flex: c.total, backgroundColor: BREAKDOWN_COLORS[i] }} />
              ))}
            </View>
            <View style={styles.breakdownLegend}>
              {categoryBreakdown.map((c, i) => (
                <View key={c.nome} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: BREAKDOWN_COLORS[i] }]} />
                  <Text style={styles.legendText} numberOfLines={1}>{c.nome}</Text>
                </View>
              ))}
            </View>
          </>
        )}
        <Text style={styles.summaryCount}>{summary?.quantidade ?? 0} gasto(s)</Text>
      </View>

      {/* Lista */}
      {isLoading && expenses.length === 0 ? (
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 32 }} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(e) => String(e.id)}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={colors.accent} />}
          renderSectionHeader={({ section }) => <Text style={styles.dayHeader}>{section.title}</Text>}
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
  breakdownBar: {
    flexDirection: 'row', alignSelf: 'stretch', height: 8, borderRadius: 4,
    overflow: 'hidden', marginTop: 16,
  },
  breakdownLegend: { flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-between', marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: colors.textMuted },
  dayHeader: {
    fontSize: 13, color: colors.textTertiary, fontWeight: '700', letterSpacing: 0.5,
    marginHorizontal: 16, marginTop: 14, marginBottom: 8,
  },
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
  cardDesc: { fontSize: 12, color: colors.textSecondary, maxWidth: 180, marginTop: 2 },
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
