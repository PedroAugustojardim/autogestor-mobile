import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';
import { useAuthStore } from '../../store/authStore';
import { PerfilStackParamList } from '../../types/navigation';
import api from '../../services/api';
import { colors } from '../../theme/colors';

type Nav = NativeStackNavigationProp<PerfilStackParamList>;
type FeatherName = React.ComponentProps<typeof Feather>['name'];

const PLAN_LABELS: Record<string, { label: string; cor: string; desc: string }> = {
  gratuito:       { label: 'Gratuito',       cor: colors.textTertiary, desc: '1 veículo · Gastos básicos · Relatórios 6 meses' },
  premium_mensal: { label: 'Premium Mensal', cor: colors.accent,       desc: 'Veículos ilimitados · Todos os relatórios · Suporte prioritário' },
  premium_anual:  { label: 'Premium Anual',  cor: colors.success,      desc: 'Veículos ilimitados · Todos os relatórios · 2 meses grátis' },
};

function Row({
  icon, label, value, onPress, danger = false,
}: { icon: FeatherName; label: string; value?: string; onPress?: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
      <View style={styles.rowIconWrap}>
        <Feather name={icon} size={17} color={danger ? colors.danger : colors.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, danger && { color: colors.danger }]}>{label}</Text>
        {value ? <Text style={styles.rowValue} numberOfLines={1}>{value}</Text> : null}
      </View>
      {onPress && <Feather name="chevron-right" size={16} color={colors.textTertiary} />}
    </TouchableOpacity>
  );
}

export function PerfilScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuthStore();

  const plano = user?.plano ?? 'gratuito';
  const planInfo = PLAN_LABELS[plano];

  // undefined logo após login/register (a resposta desses endpoints não inclui o
  // campo) — só GET /users/me (via restoreSession) devolve; default true bate com
  // o default da coluna no banco.
  const [notifEnabled, setNotifEnabled] = useState(user?.notificationsEnabled ?? true);
  const [savingNotif, setSavingNotif] = useState(false);

  const handleToggleNotifications = async (value: boolean) => {
    setNotifEnabled(value);
    setSavingNotif(true);
    try {
      await api.put('/users/me/notifications', { notificationsEnabled: value });
    } catch {
      // Só reverte se o switch ainda mostra o valor otimista desta chamada — se
      // outro toggle já mudou o valor de novo nesse meio-tempo, não pisa em cima
      // do estado mais recente.
      setNotifEnabled((current) => (current === value ? !value : current));
      Alert.alert('Erro', 'Não foi possível atualizar a preferência de notificações');
    } finally {
      setSavingNotif(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Avatar e nome */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>

        {/* Badge do plano */}
        <View style={[styles.planBadge, { borderColor: planInfo.cor }]}>
          <Text style={[styles.planBadgeText, { color: planInfo.cor }]}>
            {planInfo.label}
          </Text>
        </View>
      </View>

      {/* Seção: Conta */}
      <Text style={styles.section}>Conta</Text>
      <View style={styles.card}>
        <Row icon="user" label="Editar nome" value={user?.name} onPress={() => navigation.navigate('EditarNome')} />
        <View style={styles.divider} />
        <Row icon="lock" label="Alterar senha" onPress={() => navigation.navigate('AlterarSenha')} />
      </View>

      {/* Seção: Plano */}
      <Text style={styles.section}>Meu Plano</Text>
      <View style={styles.card}>
        <View style={styles.planCard}>
          <Text style={styles.planTitle}>{planInfo.label}</Text>
          <Text style={styles.planDesc}>{planInfo.desc}</Text>
          {plano === 'gratuito' && (
            <TouchableOpacity
              style={styles.upgradeBtn}
              onPress={() => navigation.navigate('Planos')}
            >
              <Feather name="zap" size={15} color={colors.white} />
              <Text style={styles.upgradeBtnText}>Fazer upgrade para Premium</Text>
            </TouchableOpacity>
          )}
          {plano !== 'gratuito' && (
            <View style={styles.premiumActive}>
              <Feather name="check-circle" size={15} color={colors.success} />
              <Text style={styles.premiumActiveText}>Plano ativo</Text>
            </View>
          )}
        </View>
      </View>

      {/* Seção: Preferências */}
      <Text style={styles.section}>Preferências</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowIconWrap}>
            <Feather name="bell" size={17} color={colors.textMuted} />
          </View>
          <Text style={[styles.rowLabel, { flex: 1 }]}>Notificações</Text>
          <Switch
            value={notifEnabled}
            onValueChange={handleToggleNotifications}
            disabled={savingNotif}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={colors.white}
          />
        </View>
      </View>

      {/* Seção: Conta — ações perigosas */}
      <Text style={styles.section}>Sessão</Text>
      <View style={styles.card}>
        <Row icon="log-out" label="Sair da conta" onPress={handleLogout} danger />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { alignItems: 'center', paddingTop: 36, paddingBottom: 28, paddingHorizontal: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: colors.white },
  userName: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  userEmail: { fontSize: 13.5, color: colors.textSecondary, marginBottom: 14 },
  planBadge: { borderWidth: 1.5, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 5, backgroundColor: colors.surface },
  planBadgeText: { fontSize: 12.5, fontWeight: '700' },
  section: { fontSize: 11.5, fontWeight: '700', color: colors.textTertiary, marginTop: 24, marginBottom: 8, marginHorizontal: 16, textTransform: 'uppercase', letterSpacing: 0.8 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, marginHorizontal: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowIconWrap: {
    width: 34, height: 34, borderRadius: 11, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { fontSize: 14.5, color: colors.textPrimary, fontWeight: '500' },
  rowValue: { fontSize: 12.5, color: colors.textTertiary, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.divider, marginLeft: 62 },
  planCard: { padding: 16 },
  planTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  planDesc: { fontSize: 12.5, color: colors.textSecondary, lineHeight: 19, marginBottom: 14 },
  upgradeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 13,
  },
  upgradeBtnText: { color: colors.white, fontSize: 14.5, fontWeight: '700' },
  premiumActive: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.successSoftBg, borderRadius: 12, paddingVertical: 11,
  },
  premiumActiveText: { color: colors.success, fontSize: 13.5, fontWeight: '600' },
});
