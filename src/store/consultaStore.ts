import { create } from 'zustand';
import api from '../services/api';
import { Fine, IpvaResult, DebtsResult, Recall } from '../types/consulta';

interface ConsultaState {
  fines: Fine[];
  ipva: IpvaResult | null;
  debts: DebtsResult | null;
  recalls: Recall[];
  isLoading: boolean;
  error: string | null;
  needsPlate: boolean;

  fetchAll: (vehicleId: number) => Promise<void>;
  linkPlate: (vehicleId: number, placa: string, renavam: string) => Promise<void>;
  clear: () => void;
}

// Contador de chamadas a fetchAll — permite ignorar uma resposta que chegue
// depois de uma chamada mais recente já ter sido disparada (ex.: usuário troca
// de veículo rápido na tela de Consultas), evitando sobrescrever os dados do
// veículo atual com dados de um veículo anterior que só respondeu mais tarde.
let fetchAllRequestId = 0;

export const useConsultaStore = create<ConsultaState>((set) => ({
  fines: [],
  ipva: null,
  debts: null,
  recalls: [],
  isLoading: false,
  error: null,
  needsPlate: false,

  fetchAll: async (vehicleId) => {
    const requestId = ++fetchAllRequestId;
    set({ isLoading: true, error: null, needsPlate: false });
    const [finesRes, ipvaRes, debtsRes, recallsRes] = await Promise.allSettled([
      api.get<Fine[]>(`/vehicles/${vehicleId}/fines`),
      api.get<IpvaResult>(`/vehicles/${vehicleId}/ipva`),
      api.get<DebtsResult>(`/vehicles/${vehicleId}/debts`),
      api.get<Recall[]>(`/vehicles/${vehicleId}/recalls`),
    ]);
    if (requestId !== fetchAllRequestId) return; // veículo já trocou de novo, ignora esta resposta

    const results = [finesRes, ipvaRes, debtsRes, recallsRes];
    const rejected = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
    // Os 4 endpoints exigem placa/Premium igualmente, então um 400/403 em
    // qualquer um deles já indica o próximo passo esperado (não é bem um erro)
    // — checa todas as rejeições, não só a primeira, já que uma delas pode
    // falhar por outro motivo (ex.: 500 transitório) antes de chegar na que
    // realmente carrega o 400/403.
    if (rejected.some((r) => r.reason?.response?.status === 400)) {
      set({ needsPlate: true, isLoading: false });
      return;
    }
    if (rejected.some((r) => r.reason?.response?.status === 403)) {
      set({ error: 'Recurso exclusivo para assinantes Premium', isLoading: false });
      return;
    }
    set((s) => ({
      fines: finesRes.status === 'fulfilled' ? finesRes.value.data : s.fines,
      ipva: ipvaRes.status === 'fulfilled' ? ipvaRes.value.data : s.ipva,
      debts: debtsRes.status === 'fulfilled' ? debtsRes.value.data : s.debts,
      recalls: recallsRes.status === 'fulfilled' ? recallsRes.value.data : s.recalls,
      error: rejected.length > 0 ? 'Alguns dados não puderam ser carregados' : null,
      isLoading: false,
    }));
  },

  linkPlate: async (vehicleId, placa, renavam) => {
    await api.patch(`/vehicles/${vehicleId}/plate`, { placa, renavam });
  },

  clear: () =>
    set({ fines: [], ipva: null, debts: null, recalls: [], needsPlate: false, error: null, isLoading: false }),
}));
