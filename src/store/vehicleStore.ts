import { create } from 'zustand';
import api from '../services/api';
import { Vehicle, CreateVehicleDTO } from '../types/vehicle';

interface VehicleState {
  vehicles: Vehicle[];
  activeVehicle: Vehicle | null;
  isLoading: boolean;

  fetchVehicles: () => Promise<void>;
  createVehicle: (data: CreateVehicleDTO) => Promise<Vehicle>;
  setActiveVehicle: (vehicle: Vehicle) => void;
  clear: () => void;
}

export const useVehicleStore = create<VehicleState>((set, get) => ({
  vehicles: [],
  activeVehicle: null,
  isLoading: false,

  fetchVehicles: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<Vehicle[]>('/vehicles');
      set({ vehicles: data, activeVehicle: data[0] ?? null });
    } finally {
      set({ isLoading: false });
    }
  },

  createVehicle: async (dto) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post<Vehicle>('/vehicles', dto);
      const vehicles = [...get().vehicles, data];
      set({ vehicles, activeVehicle: data });
      return data;
    } finally {
      set({ isLoading: false });
    }
  },

  setActiveVehicle: (vehicle) => set({ activeVehicle: vehicle }),

  clear: () => set({ vehicles: [], activeVehicle: null }),
}));
