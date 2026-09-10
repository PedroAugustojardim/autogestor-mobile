import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { usePollUntil } from '../../hooks/usePollUntil';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 100; // ~5 minutos a cada 3s

interface SubscriptionStatus { plano: string; pendingCheckout: boolean }

const FEATURES_FREE = [
  '1 veículo cadastrado',
  'Registro de gastos por categoria',
  'Relatório mensal (últimos 6 meses)',
  'Histórico de combustível',
];

const FEATURES_PREMIUM = [
  'Veículos ilimitados',
  'Todos os relatórios (anual, categorias)',
  'Resumo anual completo',
  'Exportar relatórios em PDF',
  'Suporte prioritário',
  'Sem anúncios',
];

type Plano = 'premium_mensal' | 'premium_anual';

interface PlanOption {
  id: Plano;
  titulo: string;
  preco: string;
  detalhe: string;
  destaque: boolean;
}

const PLANS: PlanOption[] = [
  {
    id: 'premium_mensal',
    titulo: 'Premium Mensal',
    preco: 'R$ 14,90',
    detalhe: 'por mês · cancele quando quiser',
    destaque: false,
  },
  {
    id: 'premium_anual',
    titulo: 'Premium Anual',
    preco: 'R$ 119,90',
    detalhe: 'por ano · equivale a R$ 9,99/mês',
    destaque: true,
  },
];

export function PlanosScreen() {
  const navigation = useNavigation();
  const { user, restoreSession } = useAuthStore();
  const [selected, setSelected] = useState<Plano>('premium_anual');
  const [loading, setLoading] = useState(false);

  const isPremium = user?.plano !== 'gratuito';

  // Sem deep link pra voltar automaticamente do navegador pro app depois do
  // checkout — quem realmente libera o Premium é o webhook do Mercado Pago, então
  // aqui só fica perguntando "já mudou?" a cada 3s até o usuário voltar pro app.
  const { isPolling: waitingPayment, start: startPolling, stop: stopPolling } = usePollUntil<SubscriptionStatus>({
    intervalMs: POLL_INTERVAL_MS,
    maxAttempts: MAX_POLL_ATTEMPTS,
    fetcher: async () => (await api.get<SubscriptionStatus>('/subscriptions/status')).data,
    isDone: (data) => !data.pendingCheckout,
    onDone: async (data) => {
      if (data.plano !== 'gratuito') {
        await restoreSession();
        Alert.alert(
          'Bem-vindo ao Premium!',
          'Seu plano foi ativado. Aproveite todos os recursos!',
          [{ text: 'Começar', onPress: () => navigation.goBack() }],
        );
      } else {
        Alert.alert('Pagamento não concluído', 'Não foi possível confirmar o pagamento. Tente novamente.');
      }
    },
    onMaxAttempts: (erroredLastAttempt) => {
      // Se esgotou as tentativas por erro de rede repetido (não por continuar
      // "pending"), fica em silêncio — mesmo comportamento de antes.
      if (!erroredLastAttempt) {
        Alert.alert('Ainda processando', 'Não confirmamos o pagamento ainda. Você pode conferir seu plano mais tarde.');
      }
    },
  });

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data } = await api.post<{ checkoutUrl: string }>('/subscriptions/checkout', { plano: selected });
      if (!data.checkoutUrl) throw new Error('checkoutUrl ausente na resposta');
      await Linking.openURL(data.checkoutUrl);
      startPolling();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.error ?? 'Não foi possível iniciar o pagamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 30 }}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
        <Feather name="chevron-left" size={17} color={colors.textSecondary} />
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Planos AutoGestor</Text>
      <Text style={styles.subtitle}>Gerencie seus veículos sem limites</Text>

      {/* Plano atual */}
      {!isPremium && (
        <View style={styles.currentPlan}>
          <Text style={styles.currentPlanText}>Plano atual: Gratuito</Text>
          <View style={{ gap: 4 }}>
            {FEATURES_FREE.map((f, i) => (
              <Text key={i} style={styles.freeFeat}>• {f}</Text>
            ))}
          </View>
        </View>
      )}

      {/* Banner premium já ativo */}
      {isPremium && (
        <View style={styles.premiumBanner}>
          <Feather name="check-circle" size={32} color={colors.success} style={{ marginBottom: 4 }} />
          <Text style={styles.premiumBannerTitle}>Você já é Premium!</Text>
          <Text style={styles.premiumBannerSub}>Plano: {user?.plano === 'premium_mensal' ? 'Mensal' : 'Anual'}</Text>
        </View>
      )}

      {/* Benefícios premium */}
      <Text style={styles.sectionTitle}>O que você ganha</Text>
      <View style={styles.featuresCard}>
        {FEATURES_PREMIUM.map((f, i) => (
          <View key={i} style={styles.featRow}>
            <Feather name="check-circle" size={15} color={colors.success} />
            <Text style={styles.feat}>{f}</Text>
          </View>
        ))}
      </View>

      {/* Seletor de plano */}
      {!isPremium && (
        <>
          <Text style={styles.sectionTitle}>Escolha seu plano</Text>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, selected === plan.id && styles.planCardSel]}
              onPress={() => setSelected(plan.id)}
            >
              {plan.destaque && (
                <View style={styles.badge}><Text style={styles.badgeText}>MAIS POPULAR</Text></View>
              )}
              <View style={styles.planRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTitle}>{plan.titulo}</Text>
                  <Text style={styles.planDetalhe}>{plan.detalhe}</Text>
                </View>
                <Text style={styles.planPreco}>{plan.preco}</Text>
              </View>
              <View style={[styles.radio, selected === plan.id && styles.radioSel]}>
                {selected === plan.id && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}

          {waitingPayment ? (
            <View style={styles.waitingBox}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.waitingText}>Aguardando confirmação do pagamento…</Text>
              <PrimaryButton label="Cancelar" variant="ghost" onPress={stopPolling} />
            </View>
          ) : (
            <PrimaryButton
              label={`Ativar ${selected === 'premium_anual' ? 'Plano Anual' : 'Plano Mensal'}`}
              onPress={handleUpgrade}
              loading={loading}
            />
          )}

          <Text style={styles.disclaimer}>
            Pagamento processado de forma segura pelo Mercado Pago. Cancele a qualquer momento.
          </Text>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  backText: { fontSize: 14, color: colors.textSecondary },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 13.5, color: colors.textSecondary, marginBottom: 20 },
  currentPlan: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, marginBottom: 18, gap: 10 },
  currentPlanText: { fontSize: 13.5, fontWeight: '600', color: colors.textSecondary },
  freeFeat: { fontSize: 12.5, color: colors.textTertiary },
  premiumBanner: { backgroundColor: colors.successSoftBg, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 18 },
  premiumBannerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  premiumBannerSub: { fontSize: 13, color: colors.success, marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 12, marginTop: 6 },
  featuresCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, marginBottom: 22, gap: 10 },
  featRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  feat: { fontSize: 13.5, color: colors.textPrimary },
  planCard: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1.5, borderColor: colors.border, position: 'relative',
  },
  planCardSel: { borderColor: colors.accent, backgroundColor: colors.accentSoftBg },
  badge: { backgroundColor: colors.accent, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 10 },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  planRow: { flexDirection: 'row', alignItems: 'center' },
  planTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  planDetalhe: { fontSize: 12, color: colors.textTertiary, marginTop: 3 },
  planPreco: { fontSize: 17, fontWeight: 'bold', color: colors.textPrimary },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.textTertiary, alignItems: 'center', justifyContent: 'center', position: 'absolute', right: 16, top: 16 },
  radioSel: { borderColor: colors.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  waitingBox: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingVertical: 20,
    alignItems: 'center', marginTop: 8, gap: 8,
  },
  waitingText: { color: colors.textSecondary, fontSize: 14 },
  disclaimer: { textAlign: 'center', fontSize: 11, color: colors.textTertiary, marginTop: 16 },
});
