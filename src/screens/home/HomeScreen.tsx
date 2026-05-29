import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useVehicleStore } from '../../store/vehicleStore';
import { useAuthStore } from '../../store/authStore';
import { VEHICLE_ICONS, VEHICLE_LABELS } from '../../types/vehicle';
import { HomeStackParamList } from '../../types/navigation';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

export function HomeScreen() {
  const { vehicles, activeVehicle, isLoading, fetchVehicles } = useVehicleStore();
  const { user } = useAuthStore();
  const navigation = useNavigation<Nav>();

  useEffect(() => { fetchVehicles(); }, []);

  if (isLoading && vehicles.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1B5E20" />
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
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchVehicles} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]} 👋</Text>
        <Text style={styles.headerSub}>Acompanhe seus gastos</Text>
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
          <Text style={styles.monthValue}>R$ 0,00</Text>
          <Text style={styles.monthHint}>Nenhum gasto registrado ainda</Text>
        </View>

        <TouchableOpacity
          style={styles.addExpenseBtn}
          onPress={() => navigation.getParent()?.navigate('Gastos')}
        >
          <Text style={styles.addExpenseBtnText}>+ Registrar gasto</Text>
        </TouchableOpacity>
      </View>

      {/* Placeholder lembretes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Próximos lembretes</Text>
        <View style={styles.emptySection}>
          <Text style={styles.emptySectionText}>Nenhum lembrete cadastrado</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

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
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  headerSub: { fontSize: 14, color: '#A5D6A7', marginTop: 2 },

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
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#212121', marginBottom: 8 },
  emptySection: {
    backgroundColor: '#FFF', borderRadius: 10, padding: 20,
    alignItems: 'center',
  },
  emptySectionText: { color: '#BDBDBD', fontSize: 14 },
});
