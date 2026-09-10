import { create } from 'zustand';
import api from '../services/api';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../services/secureTokenStorage';
import { useVehicleStore } from './vehicleStore';
import { useExpenseStore } from './expenseStore';
import { useReportStore } from './reportStore';
import { useMaintenanceStore } from './maintenanceStore';
import { useNotificationStore } from './notificationStore';
import { useConsultaStore } from './consultaStore';

// Usado tanto por logout() quanto pelo ramo de sessão-realmente-inválida de
// restoreSession() — um único lugar pra lembrar de atualizar quando uma nova
// store precisar ser limpa ao encerrar a sessão.
function clearAllStores() {
  useVehicleStore.getState().clear();
  useExpenseStore.getState().clear();
  useReportStore.getState().clear();
  useMaintenanceStore.getState().clear();
  useNotificationStore.getState().clear();
  useConsultaStore.getState().clear();
}

interface User {
  id: number;
  name: string;
  email: string;
  plano: 'gratuito' | 'premium_mensal' | 'premium_anual';
  // Omitido pela API em /auth/login e /auth/register (só GET /users/me manda);
  // consumidores devem tratar como ausente até o próximo restoreSession/getMe.
  notificationsEnabled?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, inviteCode: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
}

// TEMP DEV BYPASS — exploração de UI sem backend local, ver conversa com Claude Code.
// Reverter com `git checkout -- src/store/authStore.ts` antes de commitar qualquer coisa.
export const useAuthStore = create<AuthState>((set, get) => ({
  user: { id: 1, name: 'Pedro Jardim', email: 'pedro@example.com', plano: 'gratuito', notificationsEnabled: true },
  isAuthenticated: true,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      await setTokens(data.accessToken, data.refreshToken);
      set({ user: data.user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (name, email, password, inviteCode) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/register', { name, email, password, inviteCode });
      await setTokens(data.accessToken, data.refreshToken);
      set({ user: data.user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    const refreshToken = await getRefreshToken();
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {}
    await clearTokens();
    clearAllStores();
    set({ user: null, isAuthenticated: false });
  },

  restoreSession: async () => {
    return true; // TEMP DEV BYPASS — ver nota acima
    // eslint-disable-next-line no-unreachable
    let token: string | null;
    try {
      token = await getAccessToken();
    } catch {
      // Leitura do Keychain falhou (ex.: chave invalidada por troca de tela de
      // bloqueio/biometria, ou erro pontual do Keystore) — não é prova de
      // sessão inválida, só que não deu pra ler o token agora. Não trava a
      // splash screen nem força logout por causa disso.
      return get().isAuthenticated;
    }
    if (!token) return false;
    try {
      const { data } = await api.get('/users/me');
      set({ user: data, isAuthenticated: true });
      return true;
    } catch (err: any) {
      if (err?.response?.status !== 401) {
        // Falha de rede/timeout ou erro do servidor (5xx, cold start do
        // Railway), não uma sessão inválida de fato — não desloga o usuário
        // por causa de uma instabilidade momentânea.
        return get().isAuthenticated;
      }
      // Sessão realmente inválida (401 mesmo após o interceptor tentar o refresh) —
      // desloga por completo, igual ao logout(), para não deixar a UI presa
      // mostrando o usuário como autenticado sem token válido.
      await clearTokens();
      clearAllStores();
      set({ user: null, isAuthenticated: false });
      return false;
    }
  },
}));
