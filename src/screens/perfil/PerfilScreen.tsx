import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { PerfilStackParamList } from '../../types/navigation';
import api from '../../services/api';

type Nav = NativeStackNavigationProp<PerfilStackParamList>;

const PLAN_LABELS: Record<string, { label: string; cor: string; desc: string }> = {
  gratuito:       { label: 'Gratuito',       cor: '#757575', desc: '1 veículo · Gastos básicos · Relatórios 6 meses' },
  premium_mensal: { label: 'Premium Mensal', cor: '#1B5E20', desc: 'Veículos ilimitados · Todos os relatórios · Suporte prioritário' },
  premium_anual:  { label: 'Premium Anual',  cor: '#1565C0', desc: 'Veículos ilimitados · Todos os relatórios · 2 meses grátis' },
};

function Row({
  icon, label, value, onPress, danger = false,
}: { icon: string; label: string; value?: string; onPress?: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, danger && { color: '#E53935' }]}>{label}</Text>
        {value ? <Text style={styles.rowValue} numberOfLines={1}>{value}</Text> : null}
      </View>
      {onPress && <Text style={styles.rowArrow}>›</Text>}
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
            ✦ {planInfo.label}
          </Text>
        </View>
      </View>

      {/* Seção: Conta */}
      <Text style={styles.section}>Conta</Text>
      <View style={styles.card}>
        <Row icon="✏️" label="Editar nome" value={user?.name} onPress={() => navigation.navigate('EditarNome')} />
        <View style={styles.divider} />
        <Row icon="🔑" label="Alterar senha" onPress={() => navigation.navigate('AlterarSenha')} />
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
              <Text style={styles.upgradeBtnText}>🚀 Fazer upgrade para Premium</Text>
            </TouchableOpacity>
          )}
          {plano !== 'gratuito' && (
            <View style={styles.premiumActive}>
              <Text style={styles.premiumActiveText}>✅ Plano ativo</Text>
            </View>
          )}
        </View>
      </View>

      {/* Seção: Preferências */}
      <Text style={styles.section}>Preferências</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowIcon}>🔔</Text>
          <Text style={[styles.rowLabel, { flex: 1 }]}>Notificações</Text>
          <Switch
            value={notifEnabled}
            onValueChange={handleToggleNotifications}
            disabled={savingNotif}
            trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
            thumbColor="#1B5E20"
          />
        </View>
      </View>

      {/* Seção: Conta — ações perigosas */}
      <Text style={styles.section}>Sessão</Text>
      <View style={styles.card}>
        <Row icon="🚪" label="Sair da conta" onPress={handleLogout} danger />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { backgroundColor: '#1B5E20', alignItems: 'center', paddingTop: 60, paddingBottom: 32, paddingHorizontal: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#1B5E20' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#A5D6A7', marginBottom: 12 },
  planBadge: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, backgroundColor: '#FFF' },
  planBadgeText: { fontSize: 13, fontWeight: '700' },
  section: { fontSize: 12, fontWeight: '700', color: '#9E9E9E', marginTop: 24, marginBottom: 8, marginHorizontal: 16, textTransform: 'uppercase', letterSpacing: 0.8 },
  card: { backgroundColor: '#FFF', borderRadius: 12, marginHorizontal: 16, overflow: 'hidden', elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon: { fontSize: 20, marginRight: 12 },
  rowLabel: { fontSize: 15, color: '#212121', fontWeight: '500' },
  rowValue: { fontSize: 13, color: '#9E9E9E', marginTop: 2 },
  rowArrow: { fontSize: 20, color: '#BDBDBD' },
  divider: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 48 },
  planCard: { padding: 16 },
  planTitle: { fontSize: 17, fontWeight: 'bold', color: '#1B5E20', marginBottom: 6 },
  planDesc: { fontSize: 13, color: '#757575', lineHeight: 20, marginBottom: 14 },
  upgradeBtn: { backgroundColor: '#1B5E20', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  upgradeBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  premiumActive: { backgroundColor: '#E8F5E9', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  premiumActiveText: { color: '#1B5E20', fontSize: 14, fontWeight: '600' },
});
