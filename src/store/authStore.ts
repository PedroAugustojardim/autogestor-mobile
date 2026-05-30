import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useVehicleStore } from './vehicleStore';
import { useExpenseStore } from './expenseStore';

interface User {
  id: number;
  name: string;
  email: string;
  plano: 'gratuito' | 'premium_mensal' | 'premium_anual';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      await AsyncStorage.multiSet([
        ['@autogestor:token', data.accessToken],
        ['@autogestor:refreshToken', data.refreshToken],
      ]);
      set({ user: data.user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      await AsyncStorage.multiSet([
        ['@autogestor:token', data.accessToken],
        ['@autogestor:refreshToken', data.refreshToken],
      ]);
      set({ user: data.user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    const refreshToken = await AsyncStorage.getItem('@autogestor:refreshToken');
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {}
    await AsyncStorage.multiRemove(['@autogestor:token', '@autogestor:refreshToken']);
    useVehicleStore.getState().clear();
    useExpenseStore.getState().clear();
    set({ user: null, isAuthenticated: false });
  },

  restoreSession: async () => {
    const token = await AsyncStorage.getItem('@autogestor:token');
    if (!token) return false;
    try {
      const { data } = await api.get('/users/me');
      set({ user: data, isAuthenticated: true });
      return true;
    } catch {
      await AsyncStorage.multiRemove(['@autogestor:token', '@autogestor:refreshToken']);
      return false;
    }
  },
}));
