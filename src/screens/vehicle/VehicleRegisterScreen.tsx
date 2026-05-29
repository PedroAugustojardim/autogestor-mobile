import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useVehicleStore } from '../../store/vehicleStore';
import { VehicleType, VEHICLE_LABELS, VEHICLE_ICONS } from '../../types/vehicle';

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
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Cadastrar veículo</Text>
        <Text style={styles.subtitle}>Escolha o tipo e preencha os dados</Text>

        {/* 4 Cards de tipo */}
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

        {/* Campos de texto */}
        <View style={styles.form}>
          <Text style={styles.label}>Marca <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Toyota, Honda, Fiat..."
            placeholderTextColor="#9E9E9E"
            value={marca}
            onChangeText={setMarca}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Modelo <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Corolla, Civic, Argo..."
            placeholderTextColor="#9E9E9E"
            value={modelo}
            onChangeText={setModelo}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Ano <Text style={styles.optional}>(opcional)</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 2020"
            placeholderTextColor="#9E9E9E"
            value={ano}
            onChangeText={setAno}
            keyboardType="numeric"
            maxLength={4}
          />

          <Text style={styles.label}>Cor <Text style={styles.optional}>(opcional)</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Prata, Preto, Branco..."
            placeholderTextColor="#9E9E9E"
            value={cor}
            onChangeText={setCor}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Apelido <Text style={styles.optional}>(opcional)</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Meu Carrão, Motinha..."
            placeholderTextColor="#9E9E9E"
            value={apelido}
            onChangeText={setApelido}
          />

          <Text style={styles.hint}>
            🔒 Placa e RENAVAM são cadastrados ao assinar o plano Premium
          </Text>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.buttonText}>Salvar veículo</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F5F5F5', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#1B5E20', fontSize: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1B5E20', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#616161', marginBottom: 24 },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  typeCard: {
    width: '47%', backgroundColor: '#FFF', borderRadius: 12,
    padding: 20, alignItems: 'center', borderWidth: 2, borderColor: '#E0E0E0',
    elevation: 1,
  },
  typeCardSelected: { borderColor: '#1B5E20', backgroundColor: '#E8F5E9' },
  typeIcon: { fontSize: 36, marginBottom: 8 },
  typeLabel: { fontSize: 14, fontWeight: '600', color: '#424242' },
  typeLabelSelected: { color: '#1B5E20' },

  form: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, elevation: 2 },
  label: { fontSize: 14, fontWeight: '600', color: '#424242', marginBottom: 6, marginTop: 14 },
  required: { color: '#E53935' },
  optional: { fontWeight: '400', color: '#9E9E9E', fontSize: 12 },
  input: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#212121', backgroundColor: '#FAFAFA',
  },
  hint: { fontSize: 12, color: '#9E9E9E', marginTop: 16, textAlign: 'center', lineHeight: 18 },
  button: {
    backgroundColor: '#1B5E20', borderRadius: 8,
    paddingVertical: 16, alignItems: 'center', marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
