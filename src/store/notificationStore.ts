import { create } from 'zustand';
import api from '../services/api';
import { Notification } from '../types/notification';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<Notification[]>('/notifications');
      set({ notifications: data });
    } catch (err: any) {
      set({ error: err?.response?.data?.error ?? 'Erro ao carregar notificações' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const { data } = await api.get<{ count: number }>('/notifications/unread-count');
      set({ unreadCount: data.count });
    } catch {
      // O badge da Home não deve quebrar a tela por causa disso.
    }
  },

  markRead: async (id) => {
    const wasUnread = get().notifications.find((n) => n.id === id)?.lida === false;
    await api.patch(`/notifications/${id}/read`);
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, lida: true } : n)),
      unreadCount: wasUnread ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
    }));
  },

  markAllRead: async () => {
    try {
      await api.patch('/notifications/read-all');
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, lida: true })),
        unreadCount: 0,
      }));
    } catch (err: any) {
      set({ error: err?.response?.data?.error ?? 'Não foi possível marcar as notificações como lidas' });
      throw err;
    }
  },

  clear: () => set({ notifications: [], unreadCount: 0 }),
}));
