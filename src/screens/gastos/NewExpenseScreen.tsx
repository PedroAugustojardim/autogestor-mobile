import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useExpenseStore } from '../../store/expenseStore';
import { useVehicleStore } from '../../store/vehicleStore';
import { ExpenseCategory, FUEL_TYPES } from '../../types/expense';
import { GastosStackParamList } from '../../types/navigation';

type RouteProps = RouteProp<GastosStackParamList, 'NewExpense'>;

export function NewExpenseScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { vehicleId } = route.params;

  const { activeVehicle } = useVehicleStore();
  const { categories, isLoading, fetchCategories, createExpense, fetchSummary } = useExpenseStore();

  const [selectedCat, setSelectedCat] = useState<ExpenseCategory | null>(null);
  const [valor, setValor] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [descricao, setDescricao] = useState('');
  const [km, setKm] = useState('');
  // Combustível extras
  const [litros, setLitros] = useState('');
  const [precoLitro, setPrecoLitro] = useState('');
  const [tipoCombustivel, setTipoCombustivel] = useState('Gasolina');
  const [showFuelFields, setShowFuelFields] = useState(false);

  useEffect(() => {
    if (activeVehicle) fetchCategories(activeVehicle.tipo);
  }, [activeVehicle]);

  const isCombustivel = selectedCat?.nome === 'Combustível';

  const handleCatSelect = (cat: ExpenseCategory) => {
    setSelectedCat(cat);
    setShowFuelFields(cat.nome === 'Combustível');
    // Auto-calcular valor se litros e preço já preenchidos
    if (cat.nome === 'Combustível' && litros && precoLitro) {
      setValor((Number(litros) * Number(precoLitro)).toFixed(2));
    }
  };

  const calcValor = () => {
    if (litros && precoLitro) setValor((Number(litros) * Number(precoLitro)).toFixed(2));
  };

  const handleSubmit = async () => {
    if (!selectedCat) { Alert.alert('Atenção', 'Selecione uma categoria'); return; }
    if (!valor || Number(valor) <= 0) { Alert.alert('Atenção', 'Informe o valor'); return; }
    try {
      await createExpense(vehicleId, {
        categoryId: selectedCat.id,
        valor: Number(valor),
        data,
        descricao: descricao || undefined,
        kmAtual: km ? Number(km) : undefined,
        litros: litros ? Number(litros) : undefined,
        precoLitro: precoLitro ? Number(precoLitro) : undefined,
        tipoCombustivel: isCombustivel ? tipoCombustivel : undefined,
      });
      await fetchSummary(vehicleId);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.error ?? 'Erro ao registrar gasto');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Registrar gasto</Text>

        {/* Grid de categorias */}
        <Text style={styles.label}>Categoria</Text>
        <View style={styles.catGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catCard, selectedCat?.id === cat.id && styles.catCardSel]}
              onPress={() => handleCatSelect(cat)}
            >
              <Text style={styles.catIcon}>{cat.icone ?? '📦'}</Text>
              <Text style={[styles.catNome, selectedCat?.id === cat.id && styles.catNomeSel]} numberOfLines={2}>
                {cat.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Campos extras de combustível */}
        {showFuelFields && (
          <View style={styles.fuelBox}>
            <Text style={styles.fuelTitle}>⛽ Detalhes do abastecimento</Text>
            <Text style={styles.label}>Tipo de combustível</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {FUEL_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.fuelChip, tipoCombustivel === t && styles.fuelChipSel]}
                  onPress={() => setTipoCombustivel(t)}
                >
                  <Text style={[styles.fuelChipText, tipoCombustivel === t && styles.fuelChipTextSel]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>Litros</Text>
                <TextInput style={styles.input} value={litros} onChangeText={setLitros}
                  keyboardType="decimal-pad" placeholder="Ex: 40.5" placeholderTextColor="#9E9E9E"
                  onEndEditing={calcValor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Preço/litro (R$)</Text>
                <TextInput style={styles.input} value={precoLitro} onChangeText={setPrecoLitro}
                  keyboardType="decimal-pad" placeholder="Ex: 5.79" placeholderTextColor="#9E9E9E"
                  onEndEditing={calcValor} />
              </View>
            </View>
          </View>
        )}

        {/* Campos principais */}
        <View style={styles.form}>
          <Text style={styles.label}>Valor (R$) *</Text>
          <TextInput style={styles.input} value={valor} onChangeText={setValor}
            keyboardType="decimal-pad" placeholder="0,00" placeholderTextColor="#9E9E9E" />

          <Text style={styles.label}>Data *</Text>
          <TextInput style={styles.input} value={data} onChangeText={setData}
            placeholder="AAAA-MM-DD" placeholderTextColor="#9E9E9E" />

          <Text style={styles.label}>KM atual <Text style={styles.optional}>(opcional)</Text></Text>
          <TextInput style={styles.input} value={km} onChangeText={setKm}
            keyboardType="number-pad" placeholder="Ex: 52000" placeholderTextColor="#9E9E9E" />

          <Text style={styles.label}>Observação <Text style={styles.optional}>(opcional)</Text></Text>
          <TextInput style={[styles.input, { height: 80 }]} value={descricao} onChangeText={setDescricao}
            multiline placeholder="Ex: Oficina do João, troca de óleo 5W30"
            placeholderTextColor="#9E9E9E" textAlignVertical="top" />

          <TouchableOpacity
            style={[styles.btn, isLoading && styles.btnDisabled]}
            onPress={handleSubmit} disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Salvar gasto</Text>}
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
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catCard: {
    width: '22%', aspectRatio: 1, backgroundColor: '#FFF', borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#E0E0E0', padding: 4,
  },
  catCardSel: { borderColor: '#1B5E20', backgroundColor: '#E8F5E9' },
  catIcon: { fontSize: 22, marginBottom: 4 },
  catNome: { fontSize: 9, color: '#424242', textAlign: 'center' },
  catNomeSel: { color: '#1B5E20', fontWeight: '700' },
  fuelBox: { backgroundColor: '#FFF3E0', borderRadius: 10, padding: 14, marginTop: 16 },
  fuelTitle: { fontSize: 14, fontWeight: '700', color: '#E65100', marginBottom: 8 },
  fuelChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#F5F5F5', marginRight: 6,
  },
  fuelChipSel: { backgroundColor: '#1B5E20' },
  fuelChipText: { fontSize: 13, color: '#424242' },
  fuelChipTextSel: { color: '#FFF', fontWeight: '600' },
  row: { flexDirection: 'row' },
  form: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginTop: 16, elevation: 1 },
  input: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#212121', backgroundColor: '#FAFAFA',
  },
  btn: { backgroundColor: '#1B5E20', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
