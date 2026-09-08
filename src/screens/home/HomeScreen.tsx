import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useVehicleStore } from '../../store/vehicleStore';
import { useAuthStore } from '../../store/authStore';
import { useExpenseStore } from '../../store/expenseStore';
import { useMaintenanceStore } from '../../store/maintenanceStore';
import { useNotificationStore } from '../../store/notificationStore';
import { VEHICLE_ICONS, VEHICLE_LABELS } from '../../types/vehicle';
import { HomeStackParamList } from '../../types/navigation';
import { formatDateBR as formatReminderDate } from '../../utils/date';

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
        <ActivityIndicator size="large" color="#1B5E20" />
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
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}
    >
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]} 👋</Text>
            <Text style={styles.headerSub}>Acompanhe seus gastos</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notificacoes')}>
            <Text style={styles.bellIcon}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
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
            <Text style={styles.sectionLink}>Ver tudo →</Text>
          </TouchableOpacity>
        </View>
        {nextReminder ? (
          <TouchableOpacity style={styles.reminderCard} onPress={() => navigation.navigate('Manutencao')}>
            <Text style={styles.reminderIcon}>🔧</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.reminderTipo}>{nextReminder.tipo}</Text>
              <Text style={styles.reminderData}>Previsto para {formatReminderDate(nextReminder.dataPrevista)}</Text>
            </View>
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
            <Text style={styles.consultaIcon}>🚨</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.consultaTitle}>Consultas SP</Text>
              <Text style={styles.consultaSubtitle}>Multas, IPVA, licenciamento e recall</Text>
            </View>
            <Text style={styles.consultaArrow}>›</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 15, color: '#E53935', textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: '#1B5E20', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24 },
  retryText: { color: '#FFF', fontWeight: '600' },

  // Empty state
  emptyContainer: {
    flex: 1, backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  emptyIcon: { fontSize: 72, marginBottom: 20 },
  emptyTitle: { fontSize: 24, fontWeight: 'bold', color: '#1B5E20', marginBottom: 12 },
  emptySubtitle: {
    fontSize: 15, color: '#616161', textAlign: 'center',
    lineHeight: 22, marginBottom: 32,
  },
  addButton: {
    backgroundColor: '#1B5E20', borderRadius: 10,
    paddingVertical: 16, paddingHorizontal: 32,
  },
  addButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  // Header
  header: { backgroundColor: '#1B5E20', padding: 24, paddingTop: 48 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  headerSub: { fontSize: 14, color: '#A5D6A7', marginTop: 2 },
  bellBtn: { padding: 4 },
  bellIcon: { fontSize: 24 },
  bellBadge: {
    position: 'absolute', top: -2, right: -4,
    backgroundColor: '#E53935', borderRadius: 9, minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  bellBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },

  // Vehicle card
  vehicleCard: {
    backgroundColor: '#FFF', margin: 16, borderRadius: 12,
    padding: 20, elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  vehicleCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vehicleIcon: { fontSize: 36 },
  vehicleName: { fontSize: 18, fontWeight: 'bold', color: '#212121' },
  vehicleType: { fontSize: 13, color: '#757575', marginTop: 2 },
  planBadge: {
    backgroundColor: '#E8F5E9', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  planBadgeText: { fontSize: 12, color: '#1B5E20', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 16 },
  monthSummary: { alignItems: 'center', marginBottom: 16 },
  monthLabel: { fontSize: 13, color: '#757575' },
  monthValue: { fontSize: 32, fontWeight: 'bold', color: '#1B5E20', marginTop: 4 },
  monthHint: { fontSize: 12, color: '#BDBDBD', marginTop: 4 },
  addExpenseBtn: {
    backgroundColor: '#E8F5E9', borderRadius: 8,
    paddingVertical: 12, alignItems: 'center',
  },
  addExpenseBtnText: { color: '#1B5E20', fontSize: 15, fontWeight: '600' },

  // Section
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#212121' },
  sectionLink: { fontSize: 13, color: '#1B5E20', fontWeight: '600' },
  emptySection: {
    backgroundColor: '#FFF', borderRadius: 10, padding: 20,
    alignItems: 'center',
  },
  emptySectionText: { color: '#BDBDBD', fontSize: 14 },
  reminderCard: {
    backgroundColor: '#FFF', borderRadius: 10, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 1,
  },
  reminderIcon: { fontSize: 24 },
  reminderTipo: { fontSize: 14, fontWeight: '700', color: '#212121' },
  reminderData: { fontSize: 12, color: '#757575', marginTop: 2 },

  consultaCard: {
    backgroundColor: '#FFF', borderRadius: 10, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 1,
  },
  consultaIcon: { fontSize: 28 },
  consultaTitle: { fontSize: 15, fontWeight: '700', color: '#212121' },
  consultaSubtitle: { fontSize: 12, color: '#757575', marginTop: 2 },
  consultaArrow: { fontSize: 24, color: '#BDBDBD' },
});
