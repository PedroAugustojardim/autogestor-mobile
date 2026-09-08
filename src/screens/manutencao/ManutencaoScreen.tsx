import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMaintenanceStore } from '../../store/maintenanceStore';
import { useVehicleStore } from '../../store/vehicleStore';
import { Maintenance, Reminder } from '../../types/maintenance';
import { HomeStackParamList } from '../../types/navigation';
import { todayLocalISO, formatDateBR as formatDate } from '../../utils/date';
import { formatCurrencyBRL } from '../../utils/currency';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

function ReminderRow({ item, onSilence, onComplete }: {
  item: Reminder; onSilence: (id: number) => void; onComplete: (id: number) => void;
}) {
  const atrasado = item.dataPrevista < todayLocalISO();
  return (
    <View style={styles.reminderRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.reminderTipo}>{item.tipo}</Text>
        <Text style={[styles.reminderData, atrasado && styles.reminderAtrasado]}>
          {atrasado ? 'Atrasado — ' : 'Previsto para '}{formatDate(item.dataPrevista)}
        </Text>
      </View>
      <TouchableOpacity onPress={() => onComplete(item.id)} style={styles.reminderBtn}>
        <Text style={styles.reminderBtnText}>✓ Feito</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onSilence(item.id)} style={styles.reminderBtnGhost}>
        <Text style={styles.reminderBtnGhostText}>Silenciar</Text>
      </TouchableOpacity>
    </View>
  );
}

function MaintenanceRow({ item, onDelete }: { item: Maintenance; onDelete: (id: number) => void }) {
  return (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTipo}>{item.tipo}</Text>
        {item.descricao ? <Text style={styles.cardDesc} numberOfLines={1}>{item.descricao}</Text> : null}
        <Text style={styles.cardData}>
          {formatDate(item.data)}{item.km != null ? ` · ${item.km.toLocaleString('pt-BR')} km` : ''}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        {item.custo != null && <Text style={styles.cardValor}>{formatCurrencyBRL(item.custo)}</Text>}
        <TouchableOpacity onPress={() => onDelete(item.id)}>
          <Text style={styles.deleteBtn}>🗑️</Text>
        </TouchableOpacity>
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

  const proximos = reminders.filter((r) => !r.concluido && !r.silenciado);

  if (!activeVehicle) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptySubtitle}>Cadastre um veículo primeiro</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B5E20" />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Manutenção</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('NewMaintenance', { vehicleId: activeVehicle.id })}
        >
          <Text style={styles.addBtnText}>+ Nova</Text>
        </TouchableOpacity>
      </View>

      {isLoading && <ActivityIndicator color="#1B5E20" style={{ marginTop: 24 }} />}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Próximos lembretes</Text>
        {proximos.length > 0 ? (
          proximos.map((r) => (
            <ReminderRow key={r.id} item={r} onSilence={handleSilence} onComplete={handleComplete} />
          ))
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>Nenhum lembrete cadastrado</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Histórico</Text>
        {maintenances.length > 0 ? (
          maintenances.map((m) => <MaintenanceRow key={m.id} item={m} onDelete={confirmDelete} />)
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>Nenhuma manutenção registrada</Text>
          </View>
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5', padding: 32 },
  emptySubtitle: { fontSize: 14, color: '#757575', textAlign: 'center' },
  header: {
    backgroundColor: '#1B5E20', padding: 24, paddingTop: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backText: { color: '#A5D6A7', fontSize: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  addBtn: { backgroundColor: '#FFF', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  addBtnText: { color: '#1B5E20', fontSize: 13, fontWeight: '700' },
  section: { marginHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#212121', marginBottom: 8 },
  emptySection: { backgroundColor: '#FFF', borderRadius: 10, padding: 20, alignItems: 'center' },
  emptySectionText: { color: '#BDBDBD', fontSize: 14 },
  card: {
    backgroundColor: '#FFF', borderRadius: 10, padding: 14, marginBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cardTipo: { fontSize: 14, fontWeight: '700', color: '#212121' },
  cardDesc: { fontSize: 12, color: '#757575', marginTop: 2 },
  cardData: { fontSize: 12, color: '#9E9E9E', marginTop: 4 },
  cardValor: { fontSize: 14, fontWeight: '700', color: '#1B5E20', marginBottom: 4 },
  deleteBtn: { fontSize: 16 },
  reminderRow: {
    backgroundColor: '#FFF', borderRadius: 10, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  reminderTipo: { fontSize: 14, fontWeight: '700', color: '#212121' },
  reminderData: { fontSize: 12, color: '#757575', marginTop: 2 },
  reminderAtrasado: { color: '#C62828', fontWeight: '600' },
  reminderBtn: { backgroundColor: '#E8F5E9', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10 },
  reminderBtnText: { color: '#1B5E20', fontSize: 12, fontWeight: '700' },
  reminderBtnGhost: { paddingVertical: 6, paddingHorizontal: 6 },
  reminderBtnGhostText: { color: '#9E9E9E', fontSize: 12 },
});
