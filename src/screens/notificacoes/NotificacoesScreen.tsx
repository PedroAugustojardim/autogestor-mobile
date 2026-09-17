import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNotificationStore } from '../../store/notificationStore';
import { Notification } from '../../types/notification';
import { formatDateTimeBR as formatDateTime } from '../../utils/date';
import { BackHeader } from '../../components/BackHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';

const ICONS: Record<string, React.ComponentProps<typeof Feather>['name']> = {
  lembrete: 'tool',
};

function NotificationCard({ item, onPress }: { item: Notification; onPress: () => void }) {
  const unread = !item.lida;
  return (
    <TouchableOpacity style={[styles.card, unread && styles.cardUnread]} onPress={onPress}>
      {unread && <View style={styles.dot} />}
      <View style={[styles.cardIconWrap, unread && styles.cardIconWrapUnread]}>
        <Feather name={ICONS[item.tipo] ?? 'bell'} size={17} color={unread ? colors.accent : colors.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitulo, !unread && styles.cardTituloRead]}>{item.titulo}</Text>
        <Text style={[styles.cardMensagem, unread && styles.cardMensagemUnread]}>{item.mensagem}</Text>
        <Text style={styles.cardData}>{formatDateTime(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function NotificacoesScreen() {
  const {
    notifications, unreadCount, isLoading,
    fetchNotifications, markRead, markAllRead,
  } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchNotifications(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
    } catch {
      Alert.alert('Erro', 'Não foi possível marcar as notificações como lidas. Tente novamente.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerPad}>
        <BackHeader
          title="Notificações"
          right={unreadCount > 0 ? <PrimaryButton label="Marcar todas" variant="ghost" onPress={handleMarkAllRead} /> : undefined}
        />
      </View>

      {isLoading && notifications.length === 0 ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 32 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        >
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <NotificationCard key={n.id} item={n} onPress={() => !n.lida && markRead(n.id)} />
            ))
          ) : (
            <View style={styles.empty}>
              <Feather name="bell" size={40} color={colors.textTertiary} />
              <Text style={styles.emptyText}>Nenhuma notificação por aqui</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerPad: { paddingHorizontal: 20, paddingTop: 24 },
  card: {
    position: 'relative', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  },
  cardUnread: { borderColor: colors.accent },
  dot: {
    position: 'absolute', top: 14, left: 6,
    width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent,
  },
  cardIconWrap: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
  cardIconWrapUnread: { backgroundColor: colors.accentSoftBg },
  cardTitulo: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  cardTituloRead: { color: colors.textMuted, fontWeight: '600' },
  cardMensagem: { fontSize: 12.5, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  cardMensagemUnread: { color: colors.textMuted },
  cardData: { fontSize: 11, color: colors.textTertiary, marginTop: 6 },
  empty: { alignItems: 'center', marginTop: 64, gap: 12 },
  emptyText: { color: colors.textTertiary, fontSize: 14 },
});
