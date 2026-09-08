import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useMaintenanceStore } from '../../store/maintenanceStore';
import { useVehicleStore } from '../../store/vehicleStore';
import { MAINTENANCE_TYPES } from '../../types/maintenance';
import { HomeStackParamList } from '../../types/navigation';
import { todayLocalISO } from '../../utils/date';

type RouteProps = RouteProp<HomeStackParamList, 'NewMaintenance'>;

export function NewMaintenanceScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { vehicleId } = route.params;

  const { activeVehicle } = useVehicleStore();
  const { isLoading, createMaintenance } = useMaintenanceStore();

  const tipos = activeVehicle ? MAINTENANCE_TYPES[activeVehicle.tipo] : [];

  const [tipo, setTipo] = useState<string | null>(null);
  const [data, setData] = useState(todayLocalISO());
  const [km, setKm] = useState('');
  const [custo, setCusto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [criarLembrete, setCriarLembrete] = useState(false);
  const [dataLembrete, setDataLembrete] = useState('');

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
      Alert.alert('Erro', err?.response?.data?.error ?? 'Erro ao registrar manutenção');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nova manutenção</Text>

        <Text style={styles.label}>Tipo *</Text>
        <View style={styles.chipWrap}>
          {tipos.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, tipo === t && styles.chipSel]}
              onPress={() => setTipo(t)}
            >
              <Text style={[styles.chipText, tipo === t && styles.chipTextSel]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Data *</Text>
          <TextInput style={styles.input} value={data} onChangeText={setData}
            placeholder="AAAA-MM-DD" placeholderTextColor="#9E9E9E" />

          <Text style={styles.label}>KM atual <Text style={styles.optional}>(opcional)</Text></Text>
          <TextInput style={styles.input} value={km} onChangeText={setKm}
            keyboardType="number-pad" placeholder="Ex: 52000" placeholderTextColor="#9E9E9E" />

          <Text style={styles.label}>Custo (R$) <Text style={styles.optional}>(opcional)</Text></Text>
          <TextInput style={styles.input} value={custo} onChangeText={setCusto}
            keyboardType="decimal-pad" placeholder="0,00" placeholderTextColor="#9E9E9E" />

          <Text style={styles.label}>Observação <Text style={styles.optional}>(opcional)</Text></Text>
          <TextInput style={[styles.input, { height: 80 }]} value={descricao} onChangeText={setDescricao}
            multiline placeholder="Ex: Oficina do João" placeholderTextColor="#9E9E9E" textAlignVertical="top" />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Criar lembrete para o próximo?</Text>
            <Switch value={criarLembrete} onValueChange={setCriarLembrete}
              trackColor={{ true: '#1B5E20' }} />
          </View>
          {criarLembrete && (
            <>
              <Text style={styles.label}>Data prevista do próximo *</Text>
              <TextInput style={styles.input} value={dataLembrete} onChangeText={setDataLembrete}
                placeholder="AAAA-MM-DD" placeholderTextColor="#9E9E9E" />
            </>
          )}

          <TouchableOpacity
            style={[styles.btn, isLoading && styles.btnDisabled]}
            onPress={handleSubmit} disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Salvar manutenção</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F5F5F5', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 40 },
  backBtn: { marginBottom: 12 },
  backText: { color: '#1B5E20', fontSize: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1B5E20', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#424242', marginBottom: 6, marginTop: 12 },
  optional: { fontWeight: '400', color: '#9E9E9E', fontSize: 11 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16,
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0',
  },
  chipSel: { backgroundColor: '#1B5E20', borderColor: '#1B5E20' },
  chipText: { fontSize: 13, color: '#424242' },
  chipTextSel: { color: '#FFF', fontWeight: '600' },
  form: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginTop: 16, elevation: 1 },
  input: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#212121', backgroundColor: '#FAFAFA',
  },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 16,
  },
  switchLabel: { fontSize: 14, color: '#424242', fontWeight: '600', flex: 1 },
  btn: { backgroundColor: '#1B5E20', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
