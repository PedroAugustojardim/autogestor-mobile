import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useVehicleStore } from '../../store/vehicleStore';
import { useConsultaStore } from '../../store/consultaStore';
import { formatDateShortBR as formatDate } from '../../utils/date';
import { formatCurrencyBRL as formatCurrency } from '../../utils/currency';

function PlateForm({ vehicleId, onLinked }: { vehicleId: number; onLinked: () => void }) {
  const { linkPlate } = useConsultaStore();
  const [placa, setPlaca] = useState('');
  const [renavam, setRenavam] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await linkPlate(vehicleId, placa.trim().toUpperCase(), renavam.trim());
      onLinked();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.error ?? 'Não foi possível cadastrar a placa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.plateCard}>
      <Text style={styles.plateIcon}>🚗</Text>
      <Text style={styles.plateTitle}>Cadastre a placa do veículo</Text>
      <Text style={styles.plateSubtitle}>
        As consultas de multas, IPVA e licenciamento precisam da placa e do RENAVAM cadastrados.
      </Text>
      <Text style={styles.label}>Placa</Text>
      <TextInput
        style={styles.input}
        placeholder="AAA1A23"
        placeholderTextColor="#9E9E9E"
        autoCapitalize="characters"
        maxLength={7}
        value={placa}
        onChangeText={setPlaca}
      />
      <Text style={styles.label}>RENAVAM</Text>
      <TextInput
        style={styles.input}
        placeholder="11 dígitos"
        placeholderTextColor="#9E9E9E"
        keyboardType="number-pad"
        maxLength={11}
        value={renavam}
        onChangeText={setRenavam}
      />
      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Salvar e consultar</Text>}
      </TouchableOpacity>
    </View>
  );
}

export function ConsultasScreen() {
  const navigation = useNavigation();
  const { activeVehicle } = useVehicleStore();
  const {
    fines, ipva, debts, recalls, isLoading, error, needsPlate,
    fetchAll,
  } = useConsultaStore();
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => { if (activeVehicle) await fetchAll(activeVehicle.id); };

  useEffect(() => { load(); }, [activeVehicle?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (!activeVehicle) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Cadastre um veículo primeiro</Text>
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
        <Text style={styles.title}>Consultas SP</Text>
        <View style={{ width: 60 }} />
      </View>

      {isLoading && <ActivityIndicator color="#1B5E20" style={{ marginTop: 32 }} />}

      {!isLoading && error && (
        <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
      )}

      {!isLoading && needsPlate && (
        <PlateForm vehicleId={activeVehicle.id} onLinked={load} />
      )}

      {!isLoading && !needsPlate && !error && (
        <>
          {/* Multas */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🚨 Multas</Text>
              {fines.length > 0 && (
                <View style={styles.badge}><Text style={styles.badgeText}>{fines.length}</Text></View>
              )}
            </View>
            {fines.length > 0 ? (
              <View style={styles.card}>
                {fines.map((f) => (
                  <View key={f.id} style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{f.descricao}</Text>
                      <Text style={styles.rowSub}>{f.orgao} · {formatDate(f.data)}</Text>
                    </View>
                    <Text style={styles.rowValue}>{formatCurrency(f.valor)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}><Text style={styles.emptyCardText}>Nenhuma multa encontrada</Text></View>
            )}
          </View>

          {/* IPVA */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📄 IPVA {ipva?.ano}</Text>
            {ipva && (
              <View style={styles.card}>
                <Text style={styles.ipvaTotal}>Total: {formatCurrency(ipva.valorTotal)}</Text>
                {ipva.parcelas.map((p) => (
                  <View key={p.numero} style={styles.row}>
                    <Text style={styles.rowTitle}>Parcela {p.numero}</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.rowValue}>{formatCurrency(p.valor)}</Text>
                      <Text style={[styles.rowSub, p.paga ? styles.paga : styles.pendente]}>
                        {p.paga ? '✅ Paga' : `Vence ${formatDate(p.vencimento)}`}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Licenciamento */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Licenciamento</Text>
            {debts && (
              <View style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.rowTitle}>Vencimento</Text>
                  <Text style={[styles.rowValue, debts.licenciamento.pendente ? styles.pendente : styles.paga]}>
                    {formatDate(debts.licenciamento.vencimento)} {debts.licenciamento.pendente ? '· Pendente' : '· Em dia'}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Recall */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔧 Recall</Text>
            {recalls.length > 0 ? (
              <View style={styles.card}>
                {recalls.map((r) => (
                  <View key={r.id} style={{ marginBottom: 8 }}>
                    <Text style={styles.rowTitle}>{r.titulo}</Text>
                    <Text style={styles.rowSub}>{r.descricao}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}><Text style={styles.emptyCardText}>Nenhum recall pendente</Text></View>
            )}
          </View>
        </>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5', padding: 32 },
  emptyText: { fontSize: 14, color: '#757575', textAlign: 'center' },
  header: {
    backgroundColor: '#1B5E20', padding: 24, paddingTop: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backText: { color: '#A5D6A7', fontSize: 15, width: 60 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  errorBox: { margin: 16, padding: 12, backgroundColor: '#FFEBEE', borderRadius: 8 },
  errorText: { color: '#C62828', fontSize: 13 },
  section: { marginHorizontal: 16, marginTop: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#212121', marginBottom: 8 },
  badge: { backgroundColor: '#E53935', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: '#FFF', borderRadius: 10, padding: 14, elevation: 1 },
  emptyCard: { backgroundColor: '#FFF', borderRadius: 10, padding: 20, alignItems: 'center' },
  emptyCardText: { color: '#BDBDBD', fontSize: 13 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  rowTitle: { fontSize: 14, fontWeight: '600', color: '#212121' },
  rowSub: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
  rowValue: { fontSize: 14, fontWeight: '700', color: '#212121' },
  ipvaTotal: { fontSize: 16, fontWeight: 'bold', color: '#1B5E20', marginBottom: 8 },
  paga: { color: '#2E7D32' },
  pendente: { color: '#C62828' },
  // Formulário de placa
  plateCard: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 24, margin: 16,
    alignItems: 'center', elevation: 1,
  },
  plateIcon: { fontSize: 40, marginBottom: 12 },
  plateTitle: { fontSize: 17, fontWeight: 'bold', color: '#1B5E20', marginBottom: 6, textAlign: 'center' },
  plateSubtitle: { fontSize: 13, color: '#757575', textAlign: 'center', marginBottom: 20, lineHeight: 19 },
  label: { fontSize: 13, fontWeight: '600', color: '#424242', marginBottom: 6, alignSelf: 'flex-start' },
  input: {
    width: '100%', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#212121',
    backgroundColor: '#FAFAFA', marginBottom: 12,
  },
  btn: { backgroundColor: '#1B5E20', borderRadius: 8, paddingVertical: 14, alignItems: 'center', width: '100%', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});
