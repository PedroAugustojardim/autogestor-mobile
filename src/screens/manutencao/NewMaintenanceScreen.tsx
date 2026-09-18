import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform, Switch, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useMaintenanceStore } from '../../store/maintenanceStore';
import { useVehicleStore } from '../../store/vehicleStore';
import { MAINTENANCE_TYPES, MaintenancePrediction } from '../../types/maintenance';
import { ManutencaoStackParamList } from '../../types/navigation';
import { todayLocalISO } from '../../utils/date';
import { FormField } from '../../components/FormField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SelectableChip } from '../../components/SelectableChip';
import { colors } from '../../theme/colors';
import { getApiErrorMessage } from '../../utils/apiError';

type RouteProps = RouteProp<ManutencaoStackParamList, 'NewMaintenance'>;

export function NewMaintenanceScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { vehicleId } = route.params;

  const { activeVehicle } = useVehicleStore();
  const { isLoading, createMaintenance, predictNextDate } = useMaintenanceStore();

  const tipos = activeVehicle ? MAINTENANCE_TYPES[activeVehicle.tipo] : [];

  const [tipo, setTipo] = useState<string | null>(null);
  const [data, setData] = useState(todayLocalISO());
  const [km, setKm] = useState('');
  const [custo, setCusto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [criarLembrete, setCriarLembrete] = useState(false);
  const [dataLembrete, setDataLembrete] = useState('');
  const [dataLembreteEditadaManualmente, setDataLembreteEditadaManualmente] = useState(false);
  const [prediction, setPrediction] = useState<MaintenancePrediction | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);

  // Busca a sugestão de data quando o lembrete é ligado (ou o tipo muda com o
  // lembrete já ligado) — só preenche o campo se o usuário ainda não editou ele
  // manualmente, pra não sobrescrever uma data que a pessoa já digitou.
  useEffect(() => {
    if (!criarLembrete || !tipo) { setPrediction(null); return; }
    let cancelado = false;
    setPredictionLoading(true);
    predictNextDate(vehicleId, tipo, data, km ? Number(km) : undefined)
      .then((result) => {
        if (cancelado) return;
        setPrediction(result);
        if (result && !dataLembreteEditadaManualmente) setDataLembrete(result.dataPrevista);
      })
      .finally(() => { if (!cancelado) setPredictionLoading(false); });
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [criarLembrete, tipo]);

  const handleSubmit = async () => {
    if (!tipo) { Alert.alert('Atenção', 'Selecione o tipo de manutenção'); return; }
    if (criarLembrete && !dataLembrete) {
      Alert.alert('Atenção', 'Informe a data prevista do próximo lembrete'); return;
    }
    const parsedCusto = custo ? Number(custo.replace(',', '.')) : undefined;
    if (parsedCusto !== undefined && Number.isNaN(parsedCusto)) {
      Alert.alert('Atenção', 'Custo inválido'); return;
    }
    try {
      await createMaintenance(vehicleId, {
        tipo,
        data,
        km: km ? Number(km) : undefined,
        custo: parsedCusto,
        descricao: descricao || undefined,
        criarLembrete: criarLembrete ? { tipo, dataPrevista: dataLembrete } : undefined,
      });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Erro', getApiErrorMessage(err, 'Erro ao registrar manutenção'));
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={17} color={colors.textSecondary} />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nova manutenção</Text>

        <Text style={styles.label}>
          Tipo<Text style={styles.required}> *</Text>
        </Text>
        <View style={styles.chipWrap}>
          {tipos.map((t) => (
            <SelectableChip key={t} label={t} selected={tipo === t} onPress={() => setTipo(t)} />
          ))}
        </View>

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <FormField label="Data" required placeholder="AAAA-MM-DD" value={data} onChangeText={setData} />
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="KM atual" placeholder="Ex: 52000" keyboardType="number-pad" value={km} onChangeText={setKm} />
            </View>
          </View>
          <FormField label="Custo (R$)" placeholder="0,00" keyboardType="decimal-pad" value={custo} onChangeText={setCusto} />
          <FormField label="Observação" placeholder="Ex: Oficina do João" multiline style={{ height: 80 }} textAlignVertical="top" value={descricao} onChangeText={setDescricao} />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Criar lembrete para o próximo?</Text>
            <Switch
              value={criarLembrete}
              onValueChange={setCriarLembrete}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.white}
            />
          </View>
          {criarLembrete && (
            <View style={{ gap: 6 }}>
              <FormField
                label="Data prevista do próximo"
                required
                placeholder="AAAA-MM-DD"
                value={dataLembrete}
                onChangeText={(t) => { setDataLembrete(t); setDataLembreteEditadaManualmente(true); }}
              />
              {predictionLoading ? (
                <View style={styles.predictionRow}>
                  <ActivityIndicator size="small" color={colors.textTertiary} />
                  <Text style={styles.predictionHint}>Calculando sugestão...</Text>
                </View>
              ) : prediction && !dataLembreteEditadaManualmente ? (
                <Text style={[styles.predictionHint, prediction.atrasado && styles.predictionHintWarning]}>
                  {prediction.atrasado
                    ? 'Sugestão: já deveria ter sido feita, com base no uso do veículo'
                    : 'Sugerido automaticamente com base no uso do veículo'}
                </Text>
              ) : !prediction && !predictionLoading && tipo ? (
                <Text style={styles.predictionHint}>Sem dados suficientes pra sugerir — informe a data manualmente</Text>
              ) : null}
            </View>
          )}

          <PrimaryButton label="Salvar manutenção" onPress={handleSubmit} loading={isLoading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.bg, paddingHorizontal: 16, paddingTop: 30, paddingBottom: 40, gap: 6 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  backText: { fontSize: 14, color: colors.textSecondary },
  title: { fontSize: 21, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
  label: { fontSize: 12.5, fontWeight: '600', color: colors.textMuted, marginBottom: 10 },
  required: { color: colors.danger },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  form: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, marginTop: 16, gap: 12 },
  row: { flexDirection: 'row', gap: 10 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontSize: 13.5, color: colors.textPrimary, fontWeight: '500', flex: 1 },
  predictionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  predictionHint: { fontSize: 11.5, color: colors.textTertiary },
  predictionHintWarning: { color: colors.warning },
});
