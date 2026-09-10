import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useExpenseStore } from '../../store/expenseStore';
import { useVehicleStore } from '../../store/vehicleStore';
import { ExpenseCategory, FUEL_TYPES } from '../../types/expense';
import { GastosStackParamList } from '../../types/navigation';
import { FormField } from '../../components/FormField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SelectableChip } from '../../components/SelectableChip';
import { colors } from '../../theme/colors';

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
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={17} color={colors.textSecondary} />
          <Text style={styles.backText}>Voltar</Text>
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
            <View style={styles.fuelTitleRow}>
              <Feather name="droplet" size={14} color="#FB923C" />
              <Text style={styles.fuelTitle}>Detalhes do abastecimento</Text>
            </View>
            <Text style={styles.label}>Tipo de combustível</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {FUEL_TYPES.map((t) => (
                  <SelectableChip key={t} label={t} selected={tipoCombustivel === t} onPress={() => setTipoCombustivel(t)} />
                ))}
              </View>
            </ScrollView>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <FormField label="Litros" placeholder="Ex: 40.5" keyboardType="decimal-pad" value={litros} onChangeText={setLitros} onEndEditing={calcValor} />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Preço/litro (R$)" placeholder="Ex: 5.79" keyboardType="decimal-pad" value={precoLitro} onChangeText={setPrecoLitro} onEndEditing={calcValor} />
              </View>
            </View>
          </View>
        )}

        {/* Campos principais */}
        <View style={styles.form}>
          <FormField label="Valor (R$)" required placeholder="0,00" keyboardType="decimal-pad" value={valor} onChangeText={setValor} />
          <FormField label="Data" required placeholder="AAAA-MM-DD" value={data} onChangeText={setData} />
          <FormField label="KM atual" optional placeholder="Ex: 52000" keyboardType="number-pad" value={km} onChangeText={setKm} />
          <FormField label="Observação" optional placeholder="Ex: Oficina do João, troca de óleo 5W30" multiline style={{ height: 80 }} textAlignVertical="top" value={descricao} onChangeText={setDescricao} />

          <PrimaryButton label="Salvar gasto" onPress={handleSubmit} loading={isLoading} />
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
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catCard: {
    width: '22%', aspectRatio: 1, backgroundColor: colors.surface, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.border, padding: 4,
  },
  catCardSel: { borderColor: colors.accent, backgroundColor: colors.accentSoftBg },
  catIcon: { fontSize: 20, marginBottom: 4 },
  catNome: { fontSize: 9, color: colors.textMuted, textAlign: 'center' },
  catNomeSel: { color: colors.accent, fontWeight: '700' },
  fuelBox: { backgroundColor: '#2A1B0E', borderWidth: 1, borderColor: '#4A3218', borderRadius: 14, padding: 14, marginTop: 16, gap: 10 },
  fuelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fuelTitle: { fontSize: 13, fontWeight: '700', color: '#FB923C' },
  row: { flexDirection: 'row', gap: 10 },
  form: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, marginTop: 16, gap: 12 },
});
