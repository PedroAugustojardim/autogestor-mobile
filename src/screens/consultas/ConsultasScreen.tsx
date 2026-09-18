import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useVehicleStore } from '../../store/vehicleStore';
import { useConsultaStore } from '../../store/consultaStore';
import { formatDateShortBR as formatDate } from '../../utils/date';
import { formatCurrencyBRL as formatCurrency } from '../../utils/currency';
import { BackHeader } from '../../components/BackHeader';
import { FormField } from '../../components/FormField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';
import { getApiErrorMessage } from '../../utils/apiError';

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
      Alert.alert('Erro', getApiErrorMessage(err, 'Não foi possível cadastrar a placa'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.plateCard}>
      <View style={styles.plateIconWrap}>
        <Feather name="file-text" size={22} color={colors.accent} />
      </View>
      <Text style={styles.plateTitle}>Cadastre a placa do veículo</Text>
      <Text style={styles.plateSubtitle}>
        As consultas de multas, IPVA e licenciamento precisam da placa e do RENAVAM cadastrados.
      </Text>
      <View style={{ width: '100%', gap: 12 }}>
        <FormField label="Placa" placeholder="AAA1A23" autoCapitalize="characters" maxLength={7} value={placa} onChangeText={setPlaca} />
        <FormField label="RENAVAM" placeholder="11 dígitos" keyboardType="number-pad" maxLength={11} value={renavam} onChangeText={setRenavam} />
        <PrimaryButton label="Salvar e consultar" onPress={submit} loading={loading} />
      </View>
    </View>
  );
}

export function ConsultasScreen() {
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
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <View style={styles.headerPad}>
        <BackHeader title="Consultas SP" />
      </View>

      {isLoading && <ActivityIndicator color={colors.accent} style={{ marginTop: 32 }} />}

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
              <View style={styles.sectionIconWrap}>
                <Feather name="alert-triangle" size={14} color={colors.accent} />
              </View>
              <Text style={styles.sectionTitle}>Multas</Text>
              {fines.length > 0 && (
                <View style={styles.badge}><Text style={styles.badgeText}>{fines.length}</Text></View>
              )}
            </View>
            {fines.length > 0 ? (
              fines.map((f) => (
                <View key={f.id} style={[styles.card, styles.rowNoBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{f.descricao}</Text>
                    <Text style={styles.rowSub}>{f.orgao} · {formatDate(f.data)}</Text>
                  </View>
                  <Text style={styles.rowValueDanger}>{formatCurrency(f.valor)}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}><Text style={styles.emptyCardText}>Nenhuma multa encontrada</Text></View>
            )}
          </View>

          {/* IPVA */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <Feather name="file-text" size={14} color={colors.accent} />
              </View>
              <Text style={styles.sectionTitle}>IPVA {ipva?.ano}</Text>
            </View>
            {ipva && (() => {
              // Só a próxima parcela em aberto (a mais próxima do vencimento) é
              // destacada em vermelho — as demais em aberto ficam neutras, igual ao design.
              const nextUnpaidIdx = ipva.parcelas.findIndex((p) => !p.paga);
              return (
                <View style={styles.card}>
                  <Text style={styles.ipvaTotal}>Total: {formatCurrency(ipva.valorTotal)}</Text>
                  {ipva.parcelas.map((p, i) => (
                    <View key={p.numero} style={styles.row}>
                      <Text style={styles.rowTitle}>Parcela {p.numero}</Text>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.rowValue}>{formatCurrency(p.valor)}</Text>
                        <Text style={[styles.rowSub, p.paga ? styles.paga : (i === nextUnpaidIdx ? styles.pendente : styles.neutra)]}>
                          {p.paga ? 'Paga' : `Vence ${formatDate(p.vencimento)}`}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })()}
          </View>

          {/* Licenciamento */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <Feather name="check-circle" size={14} color={colors.accent} />
              </View>
              <Text style={styles.sectionTitle}>Licenciamento</Text>
            </View>
            {debts && (
              <View style={[styles.card, styles.rowNoBorder]}>
                <Text style={styles.rowTitle}>Vencimento {formatDate(debts.licenciamento.vencimento)}</Text>
                <View style={[styles.statusPill, debts.licenciamento.pendente ? styles.statusPillDanger : styles.statusPillSuccess]}>
                  <Text style={[styles.statusPillText, debts.licenciamento.pendente ? styles.pendente : styles.paga]}>
                    {debts.licenciamento.pendente ? 'Pendente' : 'Em dia'}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Recall */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <Feather name="tool" size={14} color={colors.accent} />
              </View>
              <Text style={styles.sectionTitle}>Recall</Text>
            </View>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerPad: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 32 },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  errorBox: { marginHorizontal: 20, padding: 12, backgroundColor: colors.dangerSoftBg, borderRadius: 10 },
  errorText: { color: colors.danger, fontSize: 13 },
  section: { marginHorizontal: 20, marginTop: 18, gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIconWrap: { width: 28, height: 28, borderRadius: 9, backgroundColor: colors.accentSoftBg, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, flexGrow: 1 },
  badge: { backgroundColor: colors.danger, borderRadius: 100, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14 },
  emptyCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 20, alignItems: 'center' },
  emptyCardText: { color: colors.textTertiary, fontSize: 13 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  rowNoBorder: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusPill: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 100 },
  statusPillSuccess: { backgroundColor: colors.successSoftBg },
  statusPillDanger: { backgroundColor: colors.dangerSoftBg },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  rowTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  rowSub: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  rowValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  rowValueDanger: { fontSize: 14, fontWeight: '700', color: colors.danger },
  ipvaTotal: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 8 },
  paga: { color: colors.success },
  pendente: { color: colors.danger },
  neutra: { color: colors.textSecondary },
  plateCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 24, margin: 20,
    alignItems: 'center', gap: 8,
  },
  plateIconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.accentSoftBg, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  plateTitle: { fontSize: 17, fontWeight: 'bold', color: colors.textPrimary, textAlign: 'center' },
  plateSubtitle: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 19, marginBottom: 12 },
});
