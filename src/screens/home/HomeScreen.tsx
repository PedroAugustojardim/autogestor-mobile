import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';
import { useVehicleStore } from '../../store/vehicleStore';
import { useAuthStore } from '../../store/authStore';
import { useExpenseStore } from '../../store/expenseStore';
import { useMaintenanceStore } from '../../store/maintenanceStore';
import { useNotificationStore } from '../../store/notificationStore';
import { VEHICLE_ICONS, VEHICLE_LABELS } from '../../types/vehicle';
import { HomeStackParamList } from '../../types/navigation';
import { daysBetween, elapsedFraction, formatRelativeDateBR } from '../../utils/date';
import { formatCurrencyBRL } from '../../utils/currency';
import { colors } from '../../theme/colors';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

// Sem odômetro rastreado no veículo, o status do card usa o mesmo critério de prazo
// da tela de Manutenção (atrasado / vence em até 14 dias / em dia).
function vehicleStatusLabel(nextReminderDate?: string): string {
  if (!nextReminderDate) return 'Em dia';
  const diff = daysBetween(nextReminderDate);
  if (diff < 0) return 'Atrasado';
  if (diff <= 14) return 'Próximo';
  return 'Em dia';
}

function reminderCaption(dataPrevista: string): string {
  const diff = daysBetween(dataPrevista);
  if (diff < 0) return `atrasada há ${Math.abs(diff)} dia${Math.abs(diff) === 1 ? '' : 's'}`;
  if (diff === 0) return 'vence hoje';
  return `faltam ${diff} dia${diff === 1 ? '' : 's'}`;
}

export function HomeScreen() {
  const { vehicles, activeVehicle, isLoading, error, fetchVehicles } = useVehicleStore();
  const { user } = useAuthStore();
  const { summary, expenses, fetchSummary, fetchExpenses } = useExpenseStore();
  const { nextReminder, fetchNextReminder } = useMaintenanceStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const navigation = useNavigation<Nav>();

  useEffect(() => { fetchVehicles(); fetchUnreadCount(); }, []);
  useEffect(() => {
    if (activeVehicle) {
      fetchSummary(activeVehicle.id);
      fetchExpenses(activeVehicle.id);
      fetchNextReminder(activeVehicle.id);
    }
  }, [activeVehicle?.id]);

  // Puxar-para-atualizar deve refletir tudo que aparece nesta tela, não só a
  // lista de veículos — senão o spinner passa a impressão de ter atualizado o
  // badge de notificação e o próximo lembrete quando na verdade não tocou neles.
  const handleRefresh = async () => {
    await Promise.all([
      fetchVehicles(),
      fetchUnreadCount(),
      ...(activeVehicle ? [fetchSummary(activeVehicle.id), fetchExpenses(activeVehicle.id), fetchNextReminder(activeVehicle.id)] : []),
    ]);
  };

  if (isLoading && vehicles.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (error && vehicles.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchVehicles}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Home vazia ───────────────────────────────────────────────────────────
  if (vehicles.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🚗</Text>
        <Text style={styles.emptyTitle}>Bem-vindo, {user?.name?.split(' ')[0]}!</Text>
        <Text style={styles.emptySubtitle}>
          Cadastre seu veículo para começar a registrar gastos e acompanhar tudo em um só lugar.
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('VehicleRegister')}
        >
          <Text style={styles.addButtonText}>+ Cadastrar meu veículo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Home com veículo ─────────────────────────────────────────────────────
  const v = activeVehicle!;
  const isPremium = user?.plano !== 'gratuito';
  const recentExpenses = expenses.slice(0, 3);

  type QuickAction = { icon: React.ComponentProps<typeof Feather>['name']; label: string; onPress: () => void };
  const quickActions: QuickAction[] = [
    { icon: 'file-text', label: 'Nova despesa', onPress: () => navigation.getParent()?.navigate('Gastos', { screen: 'NewExpense', params: { vehicleId: v.id } }) },
    { icon: 'tool', label: 'Manutenção', onPress: () => navigation.getParent()?.navigate('Manutencao') },
  ];
  if (isPremium) {
    quickActions.push({ icon: 'search', label: 'Consultas', onPress: () => navigation.navigate('Consultas') });
  }
  quickActions.push({ icon: 'bar-chart-2', label: 'Relatórios', onPress: () => navigation.navigate('Relatorios') });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={colors.accent} />}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.headerSub}>Acompanhe seus gastos</Text>
        </View>
        <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notificacoes')}>
          <Feather name="bell" size={18} color={colors.textMuted} />
          {unreadCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Card do veículo */}
      <View style={styles.vehicleCard}>
        <View style={styles.vehicleCardHeader}>
          <Text style={styles.vehicleEyebrow}>SEU VEÍCULO</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{vehicleStatusLabel(nextReminder?.dataPrevista)}</Text>
          </View>
        </View>

        <View style={styles.vehicleCardTop}>
          <Text style={styles.vehicleIcon}>{VEHICLE_ICONS[v.tipo]}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.vehicleName}>
              {v.apelido || `${v.marca} ${v.modelo}`}
            </Text>
            <Text style={styles.vehicleType}>
              {v.placa ?? `${VEHICLE_LABELS[v.tipo]} • ${v.ano ?? '—'}`}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.monthSummary}>
          <Text style={styles.monthLabel}>Gasto no mês</Text>
          <Text style={styles.monthValue}>{formatCurrencyBRL(summary?.total ?? 0)}</Text>
          <Text style={styles.monthHint}>
            {summary && summary.quantidade > 0
              ? `${summary.quantidade} lançamento(s)`
              : 'Nenhum gasto registrado ainda'}
          </Text>
        </View>
      </View>

      {/* Ações rápidas */}
      <View style={styles.quickActions}>
        {quickActions.map((action) => (
          <TouchableOpacity key={action.label} style={styles.quickAction} onPress={action.onPress}>
            <View style={styles.quickActionIconWrap}>
              <Feather name={action.icon} size={21} color={colors.textMuted} />
            </View>
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Próxima manutenção */}
      <View style={styles.section}>
        {nextReminder ? (
          <TouchableOpacity style={styles.reminderCard} onPress={() => navigation.getParent()?.navigate('Manutencao')}>
            <View style={styles.reminderCardTop}>
              <View style={styles.reminderIconWrap}>
                <Feather name="tool" size={16} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reminderTitle}>Próxima manutenção</Text>
                <Text style={styles.reminderSubtitle}>{nextReminder.tipo} · {reminderCaption(nextReminder.dataPrevista)}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.textTertiary} />
            </View>
            <View style={styles.reminderProgressTrack}>
              <View style={[styles.reminderProgressFill, { width: `${Math.round(elapsedFraction(nextReminder.createdAt, nextReminder.dataPrevista) * 100)}%` }]} />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>Nenhum lembrete cadastrado</Text>
            <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Manutencao')} style={{ marginTop: 8 }}>
              <Text style={styles.sectionLink}>Registrar manutenção</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Últimos gastos */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Últimos gastos</Text>
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Gastos')}>
            <Text style={styles.sectionLink}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        {recentExpenses.length > 0 ? (
          <View style={{ gap: 10 }}>
            {recentExpenses.map((exp) => (
              <View key={exp.id} style={styles.expenseRow}>
                <View style={styles.expenseIconWrap}>
                  <Text style={styles.expenseIcon}>{exp.category?.icone ?? '📦'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.expenseName}>{exp.category?.nome ?? '—'}</Text>
                  <Text style={styles.expenseDate}>{formatRelativeDateBR(exp.data)}</Text>
                </View>
                <Text style={styles.expenseValue}>{formatCurrencyBRL(exp.valor)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>Nenhum gasto registrado este mês</Text>
          </View>
        )}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bg },
  errorText: { fontSize: 15, color: colors.danger, textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  retryText: { color: colors.white, fontWeight: '600' },

  // Empty state
  emptyContainer: {
    flex: 1, backgroundColor: colors.bg,
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  emptyIcon: { fontSize: 64, marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  emptySubtitle: {
    fontSize: 15, color: colors.textSecondary, textAlign: 'center',
    lineHeight: 22, marginBottom: 32,
  },
  addButton: {
    backgroundColor: colors.accent, borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 32,
  },
  addButtonText: { color: colors.white, fontSize: 16, fontWeight: '700' },

  // Header
  topRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 4,
  },
  greeting: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  headerSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: colors.danger, borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: colors.bg,
  },
  bellBadgeText: { color: colors.white, fontSize: 9, fontWeight: '700' },

  // Vehicle card
  vehicleCard: {
    backgroundColor: colors.accent, marginHorizontal: 16, marginTop: 18, marginBottom: 4,
    borderRadius: 22, padding: 20,
  },
  vehicleCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vehicleEyebrow: { fontSize: 11, letterSpacing: 1.5, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 100,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  statusBadgeText: { fontSize: 11, color: colors.white, fontWeight: '700' },
  vehicleCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  vehicleIcon: { fontSize: 32 },
  vehicleName: { fontSize: 17, fontWeight: '700', color: colors.white },
  vehicleType: { fontSize: 12.5, color: 'rgba(255,255,255,0.78)', marginTop: 2, letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 18 },
  monthSummary: { alignItems: 'center' },
  monthLabel: { fontSize: 12.5, color: 'rgba(255,255,255,0.75)' },
  monthValue: { fontSize: 30, fontWeight: '800', color: colors.white, marginTop: 4 },
  monthHint: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 },

  // Quick actions
  quickActions: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginHorizontal: 16, marginTop: 22,
  },
  quickAction: { alignItems: 'center', gap: 8, maxWidth: 76 },
  quickActionIconWrap: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  quickActionLabel: { fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 14 },

  // Section
  section: { marginHorizontal: 16, marginTop: 22, marginBottom: 4 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  sectionLink: { fontSize: 12.5, color: colors.accent, fontWeight: '700' },
  emptySection: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 16, padding: 20, alignItems: 'center',
  },
  emptySectionText: { color: colors.textTertiary, fontSize: 13.5 },

  reminderCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 16, padding: 14, gap: 12,
  },
  reminderCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reminderIconWrap: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: colors.accentSoftBg,
    alignItems: 'center', justifyContent: 'center',
  },
  reminderTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  reminderSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  reminderProgressTrack: { width: '100%', height: 5, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  reminderProgressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },

  expenseRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  expenseIconWrap: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  expenseIcon: { fontSize: 17 },
  expenseName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  expenseDate: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  expenseValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
});
