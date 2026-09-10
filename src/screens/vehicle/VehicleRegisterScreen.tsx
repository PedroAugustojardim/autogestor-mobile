import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useVehicleStore } from '../../store/vehicleStore';
import { VehicleType, VEHICLE_LABELS, VEHICLE_ICONS } from '../../types/vehicle';
import { FormField } from '../../components/FormField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';

const VEHICLE_TYPES: VehicleType[] = ['carro', 'moto', 'caminhao', 'van'];

export function VehicleRegisterScreen() {
  const navigation = useNavigation();
  const { createVehicle, isLoading } = useVehicleStore();

  const [tipo, setTipo] = useState<VehicleType | null>(null);
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [cor, setCor] = useState('');
  const [apelido, setApelido] = useState('');

  const handleSubmit = async () => {
    if (!tipo) { Alert.alert('Atenção', 'Selecione o tipo do veículo'); return; }
    if (!marca.trim()) { Alert.alert('Atenção', 'Informe a marca'); return; }
    if (!modelo.trim()) { Alert.alert('Atenção', 'Informe o modelo'); return; }

    try {
      await createVehicle({
        tipo,
        marca: marca.trim(),
        modelo: modelo.trim(),
        ano: ano ? Number(ano) : undefined,
        cor: cor.trim() || undefined,
        apelido: apelido.trim() || undefined,
      });
      navigation.goBack();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao cadastrar veículo.';
      Alert.alert('Erro', msg);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={17} color={colors.textSecondary} />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Cadastrar veículo</Text>
        <Text style={styles.subtitle}>Escolha o tipo e preencha os dados</Text>

        <Text style={styles.label}>Tipo do veículo</Text>
        <View style={styles.typeGrid}>
          {VEHICLE_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeCard, tipo === t && styles.typeCardSelected]}
              onPress={() => setTipo(t)}
            >
              <Text style={styles.typeIcon}>{VEHICLE_ICONS[t]}</Text>
              <Text style={[styles.typeLabel, tipo === t && styles.typeLabelSelected]}>
                {VEHICLE_LABELS[t]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.form}>
          <FormField label="Marca" required placeholder="Ex: Toyota, Honda, Fiat..." autoCapitalize="words" value={marca} onChangeText={setMarca} />
          <FormField label="Modelo" required placeholder="Ex: Corolla, Civic, Argo..." autoCapitalize="words" value={modelo} onChangeText={setModelo} />
          <FormField label="Ano" optional placeholder="Ex: 2020" keyboardType="numeric" maxLength={4} value={ano} onChangeText={setAno} />
          <FormField label="Cor" optional placeholder="Ex: Prata, Preto, Branco..." autoCapitalize="words" value={cor} onChangeText={setCor} />
          <FormField label="Apelido" optional placeholder="Ex: Meu Carrão, Motinha..." value={apelido} onChangeText={setApelido} />

          <View style={styles.hintRow}>
            <Feather name="lock" size={13} color={colors.textTertiary} />
            <Text style={styles.hint}>Placa e RENAVAM são cadastrados ao assinar o plano Premium</Text>
          </View>

          <PrimaryButton label="Salvar veículo" onPress={handleSubmit} loading={isLoading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.bg, paddingHorizontal: 20, paddingTop: 30, paddingBottom: 40, gap: 6 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  backText: { fontSize: 14, color: colors.textSecondary },
  title: { fontSize: 21, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 18 },

  label: { fontSize: 12.5, fontWeight: '600', color: colors.textMuted, marginBottom: 10 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  typeCard: {
    width: '47%', backgroundColor: colors.surface, borderRadius: 14,
    padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: colors.border,
  },
  typeCardSelected: { borderColor: colors.accent, backgroundColor: colors.accentSoftBg },
  typeIcon: { fontSize: 28, marginBottom: 8 },
  typeLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  typeLabelSelected: { color: colors.accent },

  form: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 18, gap: 12 },
  hintRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 2 },
  hint: { flex: 1, fontSize: 11.5, color: colors.textTertiary, lineHeight: 15 },
});
