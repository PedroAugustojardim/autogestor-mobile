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
import { formatDateBR as formatReminderDate } from '../../utils/date';
import { colors } from '../../theme/colors';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

export function HomeScreen() {
  const { vehicles, activeVehicle, isLoading, error, fetchVehicles } = useVehicleStore();
  const { user } = useAuthStore();
  const { summary, fetchSummary } = useExpenseStore();
  const { nextReminder, fetchNextReminder } = useMaintenanceStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const navigation = useNavigation<Nav>();

  useEffect(() => { fetchVehicles(); fetchUnreadCount(); }, []);
  useEffect(() => {
    if (activeVehicle) {
      fetchSummary(activeVehicle.id);
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
      ...(activeVehicle ? [fetchNextReminder(activeVehicle.id)] : []),
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
        <View style={styles.vehicleCardTop}>
          <Text style={styles.vehicleIcon}>{VEHICLE_ICONS[v.tipo]}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.vehicleName}>
              {v.apelido || `${v.marca} ${v.modelo}`}
            </Text>
            <Text style={styles.vehicleType}>{VEHICLE_LABELS[v.tipo]} • {v.ano ?? '—'}</Text>
          </View>
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>
              {user?.plano === 'gratuito' ? 'Gratuito' : 'Premium'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.monthSummary}>
          <Text style={styles.monthLabel}>Gasto total este mês</Text>
          <Text style={styles.monthValue}>
            {`R$ ${(summary?.total ?? 0).toFixed(2).replace('.', ',')}`}
          </Text>
          <Text style={styles.monthHint}>
            {summary && summary.quantidade > 0
              ? `${summary.quantidade} lançamento(s)`
              : 'Nenhum gasto registrado ainda'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addExpenseBtn}
          onPress={() => navigation.getParent()?.navigate('Gastos')}
        >
          <Text style={styles.addExpenseBtnText}>+ Registrar gasto</Text>
        </TouchableOpacity>
      </View>

      {/* Próximo lembrete + acesso à Manutenção */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Próximos lembretes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Manutencao')}>
            <Text style={styles.sectionLink}>Ver tudo</Text>
          </TouchableOpacity>
        </View>
        {nextReminder ? (
          <TouchableOpacity style={styles.reminderCard} onPress={() => navigation.navigate('Manutencao')}>
            <View style={styles.reminderIconWrap}>
              <Feather name="tool" size={16} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reminderTipo}>{nextReminder.tipo}</Text>
              <Text style={styles.reminderData}>Previsto para {formatReminderDate(nextReminder.dataPrevista)}</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>Nenhum lembrete cadastrado</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Manutencao')} style={{ marginTop: 8 }}>
              <Text style={styles.sectionLink}>Registrar manutenção</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Consultas SP — só pra Premium */}
      {user?.plano !== 'gratuito' && (
        <View style={styles.section}>
          <TouchableOpacity style={styles.consultaCard} onPress={() => navigation.navigate('Consultas')}>
            <View style={styles.consultaIconWrap}>
              <Feather name="alert-triangle" size={17} color={colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.consultaTitle}>Consultas SP</Text>
              <Text style={styles.consultaSubtitle}>Multas, IPVA, licenciamento e recall</Text>
            </View>
            <Feather name="chevron-right" size={17} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      )}

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
  vehicleCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vehicleIcon: { fontSize: 32 },
  vehicleName: { fontSize: 17, fontWeight: '700', color: colors.white },
  vehicleType: { fontSize: 12.5, color: 'rgba(255,255,255,0.78)', marginTop: 2 },
  planBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 100,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  planBadgeText: { fontSize: 11, color: colors.white, fontWeight: '700' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 18 },
  monthSummary: { alignItems: 'center', marginBottom: 18 },
  monthLabel: { fontSize: 12.5, color: 'rgba(255,255,255,0.75)' },
  monthValue: { fontSize: 30, fontWeight: '800', color: colors.white, marginTop: 4 },
  monthHint: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  addExpenseBtn: {
    backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  addExpenseBtnText: { color: colors.white, fontSize: 14.5, fontWeight: '700' },

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
    borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  reminderIconWrap: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: colors.accentSoftBg,
    alignItems: 'center', justifyContent: 'center',
  },
  reminderTipo: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  reminderData: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  consultaCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  consultaIconWrap: {
    width: 40, height: 40, borderRadius: 13, backgroundColor: colors.warningSoftBg,
    alignItems: 'center', justifyContent: 'center',
  },
  consultaTitle: { fontSize: 14.5, fontWeight: '700', color: colors.textPrimary },
  consultaSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
