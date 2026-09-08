import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotificationStore } from '../../store/notificationStore';
import { Notification } from '../../types/notification';
import { formatDateTimeBR as formatDateTime } from '../../utils/date';

const ICONS: Record<string, string> = {
  lembrete: '🔧',
};

function NotificationCard({ item, onPress }: { item: Notification; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.card, !item.lida && styles.cardUnread]} onPress={onPress}>
      {!item.lida && <View style={styles.dot} />}
      <Text style={styles.cardIcon}>{ICONS[item.tipo] ?? '🔔'}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitulo}>{item.titulo}</Text>
        <Text style={styles.cardMensagem}>{item.mensagem}</Text>
        <Text style={styles.cardData}>{formatDateTime(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function NotificacoesScreen() {
  const navigation = useNavigation();
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notificações</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Marcar todas</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 70 }} />
        )}
      </View>

      {isLoading && notifications.length === 0 ? (
        <ActivityIndicator color="#1B5E20" style={{ marginTop: 32 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B5E20" />}
        >
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <NotificationCard key={n.id} item={n} onPress={() => !n.lida && markRead(n.id)} />
            ))
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyText}>Nenhuma notificação por aqui</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#1B5E20', padding: 24, paddingTop: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backText: { color: '#A5D6A7', fontSize: 15, width: 70 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  markAllText: { color: '#A5D6A7', fontSize: 13, fontWeight: '600', width: 70, textAlign: 'right' },
  card: {
    backgroundColor: '#FFF', borderRadius: 10, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  },
  cardUnread: { backgroundColor: '#F1F8E9' },
  dot: {
    position: 'absolute', top: 14, right: 14,
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#1B5E20',
  },
  cardIcon: { fontSize: 22 },
  cardTitulo: { fontSize: 14, fontWeight: '700', color: '#212121' },
  cardMensagem: { fontSize: 13, color: '#616161', marginTop: 2, lineHeight: 18 },
  cardData: { fontSize: 11, color: '#9E9E9E', marginTop: 6 },
  empty: { alignItems: 'center', marginTop: 64 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#9E9E9E', fontSize: 15 },
});
