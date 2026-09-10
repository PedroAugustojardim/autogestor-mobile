import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';
import { useMaintenanceStore } from '../../store/maintenanceStore';
import { useVehicleStore } from '../../store/vehicleStore';
import { Maintenance, Reminder } from '../../types/maintenance';
import { HomeStackParamList } from '../../types/navigation';
import { daysBetween, formatDateBR as formatDate } from '../../utils/date';
import { formatCurrencyBRL } from '../../utils/currency';
import { colors } from '../../theme/colors';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

function reminderStatus(dataPrevista: string): { tone: 'danger' | 'warning' | 'success'; label: string } {
  const diff = daysBetween(dataPrevista);
  if (diff < 0) return { tone: 'danger', label: `Atrasado há ${Math.abs(diff)} dia${Math.abs(diff) === 1 ? '' : 's'}` };
  if (diff === 0) return { tone: 'danger', label: 'Vence hoje' };
  if (diff <= 14) return { tone: 'warning', label: `Vence em ${diff} dia${diff === 1 ? '' : 's'}` };
  return { tone: 'success', label: `Previsto para ${formatDate(dataPrevista)}` };
}

// Indexados dinamicamente por `tone` — por isso ficam fora do StyleSheet.create,
// que exige chaves estáticas.
const TONE_DOT: Record<'danger' | 'warning' | 'success', { backgroundColor: string; borderColor: string }> = {
  danger: { backgroundColor: colors.danger, borderColor: colors.danger },
  warning: { backgroundColor: colors.warning, borderColor: colors.warning },
  success: { backgroundColor: colors.success, borderColor: colors.success },
};
const TONE_TEXT: Record<'danger' | 'warning' | 'success', { color: string }> = {
  danger: { color: colors.danger },
  warning: { color: colors.warning },
  success: { color: colors.success },
};

function TimelineSpine({ tone, hollow, isFirst, isLast }: {
  tone: 'danger' | 'warning' | 'success'; hollow?: boolean; isFirst: boolean; isLast: boolean;
}) {
  return (
    <View style={styles.spineCol}>
      <View style={[styles.spineLine, isFirst && styles.spineLineHidden]} />
      <View style={[styles.spineDot, TONE_DOT[tone], hollow && styles.spineDotHollow]} />
      <View style={[styles.spineLine, isLast && styles.spineLineHidden]} />
    </View>
  );
}

function ReminderRow({
  item, isFirst, isLast, onSilence, onComplete,
}: {
  item: Reminder; isFirst: boolean; isLast: boolean;
  onSilence: (id: number) => void; onComplete: (id: number) => void;
}) {
  const status = reminderStatus(item.dataPrevista);
  return (
    <View style={styles.timelineRow}>
      <TimelineSpine tone={status.tone} isFirst={isFirst} isLast={isLast} />
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{item.tipo}</Text>
        <Text style={[styles.rowStatus, TONE_TEXT[status.tone]]}>{status.label}</Text>
        <View style={styles.rowActions}>
          <TouchableOpacity onPress={() => onComplete(item.id)} style={styles.chipBtn}>
            <Text style={styles.chipBtnText}>Feito</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onSilence(item.id)} style={styles.ghostBtn}>
            <Text style={styles.ghostBtnText}>Silenciar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function MaintenanceRow({
  item, isFirst, isLast, onDelete,
}: {
  item: Maintenance; isFirst: boolean; isLast: boolean; onDelete: (id: number) => void;
}) {
  return (
    <View style={styles.timelineRow}>
      <TimelineSpine tone="success" hollow isFirst={isFirst} isLast={isLast} />
      <View style={styles.rowContent}>
        <View style={styles.rowHeadLine}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{item.tipo}</Text>
            {item.descricao ? <Text style={styles.rowDesc} numberOfLines={1}>{item.descricao}</Text> : null}
          </View>
          {item.custo != null && <Text style={styles.rowValor}>{formatCurrencyBRL(item.custo)}</Text>}
        </View>
        <View style={styles.rowFootLine}>
          <Text style={styles.rowMeta}>
            {formatDate(item.data)}{item.km != null ? ` · ${item.km.toLocaleString('pt-BR')} km` : ''}
          </Text>
          <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={8}>
            <Text style={styles.deleteBtn}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export function ManutencaoScreen() {
  const navigation = useNavigation<Nav>();
  const { activeVehicle } = useVehicleStore();
  const {
    maintenances, reminders, isLoading,
    fetchMaintenances, fetchReminders, deleteMaintenance, silenceReminder, completeReminder,
  } = useMaintenanceStore();
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!activeVehicle) return;
    await Promise.all([fetchMaintenances(activeVehicle.id), fetchReminders(activeVehicle.id)]);
  }, [activeVehicle]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const confirmDelete = (id: number) => {
    if (!activeVehicle) return;
    Alert.alert('Excluir manutenção', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteMaintenance(activeVehicle.id, id) },
    ]);
  };

  const handleSilence = async (id: number) => {
    if (!activeVehicle) return;
    try {
      await silenceReminder(activeVehicle.id, id);
    } catch {
      Alert.alert('Erro', 'Não foi possível silenciar o lembrete. Tente novamente.');
    }
  };

  const handleComplete = async (id: number) => {
    if (!activeVehicle) return;
    try {
      await completeReminder(activeVehicle.id, id);
    } catch {
      Alert.alert('Erro', 'Não foi possível concluir o lembrete. Tente novamente.');
    }
  };

  const proximos = reminders
    .filter((r) => !r.concluido && !r.silenciado)
    .slice()
    .sort((a, b) => a.dataPrevista.localeCompare(b.dataPrevista));

  const historico = maintenances.slice().sort((a, b) => b.data.localeCompare(a.data));

  if (!activeVehicle) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptySubtitle}>Cadastre um veículo pra começar a acompanhar a manutenção.</Text>
      </View>
    );
  }

  const vehicleLine = [activeVehicle.marca, activeVehicle.modelo].filter(Boolean).join(' ')
    + (activeVehicle.placa ? ` · ${activeVehicle.placa}` : '');

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
            <Feather name="chevron-left" size={18} color={colors.textSecondary} />
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('NewMaintenance', { vehicleId: activeVehicle.id })}
          >
            <Feather name="plus" size={14} color={colors.white} />
            <Text style={styles.addBtnText}>Nova</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Manutenção</Text>
        {vehicleLine ? <Text style={styles.vehicleLine}>{vehicleLine}</Text> : null}
      </View>

      {isLoading && <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />}

      <View style={styles.timeline}>
        {proximos.length > 0 ? (
          proximos.map((r, i) => (
            <ReminderRow
              key={r.id} item={r} isFirst={i === 0} isLast={false}
              onSilence={handleSilence} onComplete={handleComplete}
            />
          ))
        ) : (
          <View style={styles.emptyNotice}>
            <Text style={styles.emptyNoticeText}>
              Nenhum lembrete agendado. Ao registrar uma manutenção, você pode já marcar a próxima.
            </Text>
          </View>
        )}

        <View style={styles.todayDivider}>
          <View style={styles.todayLine} />
          <Text style={styles.todayLabel}>Hoje</Text>
          <View style={styles.todayLine} />
        </View>

        {historico.length > 0 ? (
          historico.map((m, i) => (
            <MaintenanceRow key={m.id} item={m} isFirst={i === 0} isLast={i === historico.length - 1} onDelete={confirmDelete} />
          ))
        ) : (
          <View style={styles.emptyNotice}>
            <Text style={styles.emptyNoticeText}>
              Nenhuma manutenção registrada ainda. Toque em "+ Nova" pra começar o histórico deste veículo.
            </Text>
          </View>
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 32 },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 18 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: colors.textSecondary, fontSize: 14 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginTop: 14 },
  vehicleLine: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14,
  },
  addBtnText: { color: colors.white, fontSize: 13, fontWeight: '700' },

  timeline: { paddingHorizontal: 20, paddingTop: 6 },

  timelineRow: { flexDirection: 'row' },
  spineCol: { width: 26, alignItems: 'center' },
  spineLine: { width: 2, flex: 1, backgroundColor: colors.border, minHeight: 10 },
  spineLineHidden: { backgroundColor: 'transparent' },
  spineDot: { width: 11, height: 11, borderRadius: 6, marginVertical: 4 },
  spineDotHollow: { backgroundColor: colors.bg, borderWidth: 2 },

  rowContent: { flex: 1, paddingBottom: 22, paddingLeft: 10 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  rowStatus: { fontSize: 13, fontWeight: '600', marginTop: 3 },
  rowDesc: { fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },

  rowActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  chipBtn: { backgroundColor: colors.successSoftBg, borderRadius: 7, paddingVertical: 6, paddingHorizontal: 12 },
  chipBtnText: { color: colors.success, fontSize: 12.5, fontWeight: '700' },
  ghostBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  ghostBtnText: { color: colors.textSecondary, fontSize: 12.5 },

  rowHeadLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rowValor: { fontSize: 14.5, fontWeight: '700', color: colors.textPrimary, fontVariant: ['tabular-nums'] },
  rowFootLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  rowMeta: { fontSize: 12.5, color: colors.textTertiary, fontVariant: ['tabular-nums'] },
  deleteBtn: { fontSize: 12.5, color: colors.danger },

  todayDivider: { flexDirection: 'row', alignItems: 'center', marginLeft: 26, paddingLeft: 10, marginBottom: 14 },
  todayLine: { flex: 1, height: 1, backgroundColor: colors.border },
  todayLabel: { fontSize: 12, color: colors.textTertiary, fontWeight: '600', marginHorizontal: 10 },

  emptyNotice: { paddingLeft: 36, paddingBottom: 20, paddingRight: 4 },
  emptyNoticeText: { fontSize: 13.5, color: colors.textSecondary, lineHeight: 19 },
});
