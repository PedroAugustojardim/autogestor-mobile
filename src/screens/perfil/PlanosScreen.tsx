import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { usePollUntil } from '../../hooks/usePollUntil';

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
  '✅ Veículos ilimitados',
  '✅ Todos os relatórios (anual, categorias)',
  '✅ Resumo anual completo',
  '✅ Exportar relatórios em PDF',
  '✅ Suporte prioritário',
  '✅ Sem anúncios',
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
          '🎉 Bem-vindo ao Premium!',
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
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Planos AutoGestor</Text>
      <Text style={styles.subtitle}>Gerencie seus veículos sem limites</Text>

      {/* Plano atual */}
      {!isPremium && (
        <View style={styles.currentPlan}>
          <Text style={styles.currentPlanText}>Plano atual: Gratuito</Text>
          <View style={styles.freeFeatures}>
            {FEATURES_FREE.map((f, i) => (
              <Text key={i} style={styles.freeFeat}>• {f}</Text>
            ))}
          </View>
        </View>
      )}

      {/* Banner premium já ativo */}
      {isPremium && (
        <View style={styles.premiumBanner}>
          <Text style={styles.premiumBannerIcon}>🌟</Text>
          <Text style={styles.premiumBannerTitle}>Você já é Premium!</Text>
          <Text style={styles.premiumBannerSub}>Plano: {user?.plano === 'premium_mensal' ? 'Mensal' : 'Anual'}</Text>
        </View>
      )}

      {/* Benefícios premium */}
      <Text style={styles.sectionTitle}>O que você ganha</Text>
      <View style={styles.featuresCard}>
        {FEATURES_PREMIUM.map((f, i) => (
          <Text key={i} style={styles.feat}>{f}</Text>
        ))}
      </View>

      {/* Seletor de plano */}
      {!isPremium && (
        <>
          <Text style={styles.sectionTitle}>Escolha seu plano</Text>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, selected === plan.id && styles.planCardSel, plan.destaque && styles.planCardDestaque]}
              onPress={() => setSelected(plan.id)}
            >
              {plan.destaque && (
                <View style={styles.badge}><Text style={styles.badgeText}>MAIS POPULAR</Text></View>
              )}
              <View style={styles.planRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planTitle, selected === plan.id && styles.planTitleSel]}>{plan.titulo}</Text>
                  <Text style={styles.planDetalhe}>{plan.detalhe}</Text>
                </View>
                <Text style={[styles.planPreco, selected === plan.id && styles.planPrecoSel]}>{plan.preco}</Text>
              </View>
              <View style={[styles.radio, selected === plan.id && styles.radioSel]}>
                {selected === plan.id && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}

          {waitingPayment ? (
            <View style={styles.waitingBox}>
              <ActivityIndicator color="#1B5E20" />
              <Text style={styles.waitingText}>Aguardando confirmação do pagamento…</Text>
              <TouchableOpacity onPress={stopPolling}>
                <Text style={styles.waitingCancel}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.cta, loading && styles.ctaDisabled]}
              onPress={handleUpgrade}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.ctaText}>Ativar {selected === 'premium_anual' ? 'Plano Anual' : 'Plano Mensal'}</Text>}
            </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 24, paddingTop: 56 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#1B5E20', fontSize: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1B5E20', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#757575', marginBottom: 24 },
  currentPlan: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 20, elevation: 1 },
  currentPlanText: { fontSize: 14, fontWeight: '600', color: '#9E9E9E', marginBottom: 10 },
  freeFeatures: {},
  freeFeat: { fontSize: 13, color: '#757575', marginBottom: 4 },
  premiumBanner: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 20 },
  premiumBannerIcon: { fontSize: 40, marginBottom: 8 },
  premiumBannerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1B5E20' },
  premiumBannerSub: { fontSize: 14, color: '#4CAF50', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#212121', marginBottom: 12, marginTop: 8 },
  featuresCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 24, elevation: 1 },
  feat: { fontSize: 14, color: '#212121', marginBottom: 8, lineHeight: 20 },
  planCard: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 2, borderColor: '#E0E0E0', position: 'relative', elevation: 1,
  },
  planCardSel: { borderColor: '#1B5E20' },
  planCardDestaque: { borderColor: '#A5D6A7' },
  badge: { backgroundColor: '#1B5E20', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 10 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  planRow: { flexDirection: 'row', alignItems: 'center' },
  planTitle: { fontSize: 16, fontWeight: '700', color: '#212121' },
  planTitleSel: { color: '#1B5E20' },
  planDetalhe: { fontSize: 12, color: '#9E9E9E', marginTop: 3 },
  planPreco: { fontSize: 18, fontWeight: 'bold', color: '#212121' },
  planPrecoSel: { color: '#1B5E20' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#BDBDBD', alignItems: 'center', justifyContent: 'center', position: 'absolute', right: 16, top: 16 },
  radioSel: { borderColor: '#1B5E20' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1B5E20' },
  cta: { backgroundColor: '#1B5E20', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
  waitingBox: {
    backgroundColor: '#FFF', borderRadius: 10, paddingVertical: 20,
    alignItems: 'center', marginTop: 8, gap: 10, elevation: 1,
  },
  waitingText: { color: '#616161', fontSize: 14 },
  waitingCancel: { color: '#9E9E9E', fontSize: 13, fontWeight: '600', marginTop: 4 },
  disclaimer: { textAlign: 'center', fontSize: 11, color: '#BDBDBD', marginTop: 16 },
});
