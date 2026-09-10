import { create } from 'zustand';
import api from '../services/api';
import { Maintenance, Reminder, CreateMaintenanceDTO } from '../types/maintenance';

// Mesmo critério do backend (ReminderController.next: concluido=false,
// silenciado=false, ORDER BY dataPrevista ASC LIMIT 1) — evita um GET extra
// quando a mutação que acabou de rodar já devolveu o lembrete atualizado.
function computeNextReminder(reminders: Reminder[]): Reminder | null {
  const pendentes = reminders.filter((r) => !r.concluido && !r.silenciado);
  if (pendentes.length === 0) return null;
  return pendentes.reduce((min, r) => (r.dataPrevista < min.dataPrevista ? r : min));
}

interface MaintenanceState {
  maintenances: Maintenance[];
  reminders: Reminder[];
  nextReminder: Reminder | null;
  isLoading: boolean;
  error: string | null;

  fetchMaintenances: (vehicleId: number) => Promise<void>;
  createMaintenance: (vehicleId: number, dto: CreateMaintenanceDTO) => Promise<Maintenance>;
  deleteMaintenance: (vehicleId: number, id: number) => Promise<void>;

  fetchReminders: (vehicleId: number) => Promise<void>;
  fetchNextReminder: (vehicleId: number) => Promise<void>;
  createReminder: (vehicleId: number, tipo: string, dataPrevista: string) => Promise<void>;
  silenceReminder: (vehicleId: number, id: number) => Promise<void>;
  completeReminder: (vehicleId: number, id: number) => Promise<void>;
  deleteReminder: (vehicleId: number, id: number) => Promise<void>;

  clear: () => void;
}

// TEMP DEV BYPASS — mesmo veículo/exemplo do scratchpad_previsao_manutencao.html.
// Reverter com `git checkout -- src/store/maintenanceStore.ts` antes de commitar qualquer coisa.
const FIXTURE_MAINTENANCES: Maintenance[] = [
  { id: 1, vehicleId: 1, tipo: 'Troca de pneu', data: '2026-07-01', km: 40200, custo: '80.00', descricao: 'Rodízio de pneus', createdAt: '2026-07-01T09:00:00.000Z' },
  { id: 2, vehicleId: 1, tipo: 'Troca de óleo', data: '2026-02-20', km: 34900, custo: '220.00', descricao: 'Óleo sintético 5W30 + filtro', createdAt: '2026-02-20T09:00:00.000Z' },
];
const FIXTURE_REMINDERS: Reminder[] = [
  { id: 1, vehicleId: 1, maintenanceId: 2, tipo: 'Troca de óleo', dataPrevista: '2026-08-20', silenciado: false, concluido: false, createdAt: '2026-02-20T09:00:00.000Z' },
  { id: 2, vehicleId: 1, maintenanceId: 1, tipo: 'Troca de pneu', dataPrevista: '2026-11-22', silenciado: false, concluido: false, createdAt: '2026-07-01T09:00:00.000Z' },
];

export const useMaintenanceStore = create<MaintenanceState>((set, get) => ({
  maintenances: FIXTURE_MAINTENANCES,
  reminders: FIXTURE_REMINDERS,
  nextReminder: FIXTURE_REMINDERS[0],
  isLoading: false,
  error: null,

  fetchMaintenances: async (vehicleId) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<Maintenance[]>(`/vehicles/${vehicleId}/maintenance`);
      set({ maintenances: data });
    } catch (err: any) {
      set({ error: err?.response?.data?.error ?? 'Erro ao carregar histórico de manutenção' });
    } finally {
      set({ isLoading: false });
    }
  },

  createMaintenance: async (vehicleId, dto) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post<Maintenance>(`/vehicles/${vehicleId}/maintenance`, dto);
      set((s) => ({ maintenances: [data, ...s.maintenances] }));
      await get().fetchNextReminder(vehicleId);
      return data;
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Erro ao registrar manutenção';
      set({ error: msg });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteMaintenance: async (vehicleId, id) => {
    await api.delete(`/vehicles/${vehicleId}/maintenance/${id}`);
    set((s) => ({ maintenances: s.maintenances.filter((m) => m.id !== id) }));
    // Duas leituras independentes (excluir a manutenção pode cascatear a exclusão
    // do lembrete vinculado, então o resultado real só vem do servidor) — sem
    // motivo pra serializar.
    await Promise.all([get().fetchReminders(vehicleId), get().fetchNextReminder(vehicleId)]);
  },

  fetchReminders: async (vehicleId) => {
    try {
      const { data } = await api.get<Reminder[]>(`/vehicles/${vehicleId}/reminders`);
      set({ reminders: data });
    } catch (err: any) {
      set({ error: err?.response?.data?.error ?? 'Erro ao carregar lembretes' });
    }
  },

  fetchNextReminder: async (vehicleId) => {
    try {
      const { data } = await api.get<Reminder | null>(`/vehicles/${vehicleId}/reminders/next`);
      set({ nextReminder: data });
    } catch {
      // Card da Home não deve quebrar por causa disso — só fica sem o lembrete.
    }
  },

  createReminder: async (vehicleId, tipo, dataPrevista) => {
    const { data } = await api.post<Reminder>(`/vehicles/${vehicleId}/reminders`, { tipo, dataPrevista });
    set((s) => {
      const reminders = [...s.reminders, data].sort((a, b) => a.dataPrevista.localeCompare(b.dataPrevista));
      return { reminders, nextReminder: computeNextReminder(reminders) };
    });
  },

  silenceReminder: async (vehicleId, id) => {
    try {
      const { data } = await api.patch<Reminder>(`/vehicles/${vehicleId}/reminders/${id}/silence`);
      set((s) => {
        const reminders = s.reminders.map((r) => (r.id === id ? data : r));
        return { reminders, nextReminder: computeNextReminder(reminders) };
      });
    } catch (err: any) {
      set({ error: err?.response?.data?.error ?? 'Não foi possível silenciar o lembrete' });
      throw err;
    }
  },

  completeReminder: async (vehicleId, id) => {
    try {
      const { data } = await api.put<Reminder>(`/vehicles/${vehicleId}/reminders/${id}`, { concluido: true });
      set((s) => {
        const reminders = s.reminders.map((r) => (r.id === id ? data : r));
        return { reminders, nextReminder: computeNextReminder(reminders) };
      });
    } catch (err: any) {
      set({ error: err?.response?.data?.error ?? 'Não foi possível concluir o lembrete' });
      throw err;
    }
  },

  deleteReminder: async (vehicleId, id) => {
    await api.delete(`/vehicles/${vehicleId}/reminders/${id}`);
    set((s) => {
      const reminders = s.reminders.filter((r) => r.id !== id);
      return { reminders, nextReminder: computeNextReminder(reminders) };
    });
  },

  clear: () => set({ maintenances: [], reminders: [], nextReminder: null, isLoading: false, error: null }),
}));
