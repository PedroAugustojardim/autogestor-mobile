import { create } from 'zustand';
import api from '../services/api';
import { Vehicle, CreateVehicleDTO } from '../types/vehicle';

interface VehicleState {
  vehicles: Vehicle[];
  activeVehicle: Vehicle | null;
  isLoading: boolean;
  error: string | null;

  fetchVehicles: () => Promise<void>;
  createVehicle: (data: CreateVehicleDTO) => Promise<Vehicle>;
  setActiveVehicle: (vehicle: Vehicle) => void;
  clear: () => void;
}

// TEMP DEV BYPASS — exploração de UI sem backend local, ver conversa com Claude Code.
// Reverter com `git checkout -- src/store/vehicleStore.ts` antes de commitar qualquer coisa.
const FIXTURE_VEHICLE = {
  id: 1, tipo: 'carro' as const, marca: 'Honda', modelo: 'Civic', ano: 2019,
  placa: 'ABC1D23', renavam: null, cor: 'Prata', apelido: null,
  createdAt: '2026-01-10T12:00:00.000Z', updatedAt: '2026-09-04T12:00:00.000Z',
};

export const useVehicleStore = create<VehicleState>((set, get) => ({
  vehicles: [FIXTURE_VEHICLE],
  activeVehicle: FIXTURE_VEHICLE,
  isLoading: false,
  error: null,

  fetchVehicles: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<Vehicle[]>('/vehicles');
      set({ vehicles: data, activeVehicle: data[0] ?? null });
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Erro ao carregar veículos';
      set({ error: msg });
    } finally {
      set({ isLoading: false });
    }
  },

  createVehicle: async (dto) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post<Vehicle>('/vehicles', dto);
      const vehicles = [...get().vehicles, data];
      set({ vehicles, activeVehicle: data });
      return data;
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Erro ao cadastrar veículo';
      set({ error: msg });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  setActiveVehicle: (vehicle) => set({ activeVehicle: vehicle }),

  clear: () => set({ vehicles: [], activeVehicle: null }),
}));
