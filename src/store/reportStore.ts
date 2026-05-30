import { create } from 'zustand';
import api from '../services/api';
import {
  MonthlyPoint, CategoryReportResponse, FuelReport, YearSummary,
} from '../types/report';

interface ReportState {
  monthly: MonthlyPoint[];
  categoryReport: CategoryReportResponse | null;
  fuelReport: FuelReport | null;
  yearSummary: YearSummary | null;
  isLoading: boolean;
  error: string | null;

  fetchMonthly: (vehicleId: number, meses?: number) => Promise<void>;
  fetchByCategory: (vehicleId: number, mes?: number, ano?: number) => Promise<void>;
  fetchFuel: (vehicleId: number, meses?: number) => Promise<void>;
  fetchYearSummary: (vehicleId: number, ano?: number) => Promise<void>;
  clear: () => void;
}

export const useReportStore = create<ReportState>((set) => ({
  monthly: [],
  categoryReport: null,
  fuelReport: null,
  yearSummary: null,
  isLoading: false,
  error: null,

  fetchMonthly: async (vehicleId, meses = 6) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<MonthlyPoint[]>(
        `/vehicles/${vehicleId}/reports/monthly?meses=${meses}`,
      );
      set({ monthly: data });
    } catch (err: any) {
      set({ error: err?.response?.data?.error ?? 'Erro ao carregar relatório mensal' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchByCategory: async (vehicleId, mes, ano) => {
    const now = new Date();
    const m = mes ?? now.getMonth() + 1;
    const a = ano ?? now.getFullYear();
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<CategoryReportResponse>(
        `/vehicles/${vehicleId}/reports/categories?mes=${m}&ano=${a}`,
      );
      set({ categoryReport: data });
    } catch (err: any) {
      set({ error: err?.response?.data?.error ?? 'Erro ao carregar relatório por categoria' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchFuel: async (vehicleId, meses = 6) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<FuelReport>(
        `/vehicles/${vehicleId}/reports/fuel?meses=${meses}`,
      );
      set({ fuelReport: data });
    } catch (err: any) {
      set({ error: err?.response?.data?.error ?? 'Erro ao carregar relatório de combustível' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchYearSummary: async (vehicleId, ano) => {
    const a = ano ?? new Date().getFullYear();
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<YearSummary>(
        `/vehicles/${vehicleId}/reports/summary-year?ano=${a}`,
      );
      set({ yearSummary: data });
    } catch (err: any) {
      set({ error: err?.response?.data?.error ?? 'Erro ao carregar resumo anual' });
    } finally {
      set({ isLoading: false });
    }
  },

  clear: () => set({ monthly: [], categoryReport: null, fuelReport: null, yearSummary: null }),
}));
