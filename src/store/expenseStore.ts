import { create } from 'zustand';
import api from '../services/api';
import {
  Expense, ExpenseCategory, ExpenseSummary, CreateExpenseDTO,
} from '../types/expense';

interface ExpenseState {
  expenses: Expense[];
  categories: ExpenseCategory[];
  summary: ExpenseSummary | null;
  isLoading: boolean;
  error: string | null;
  currentMes: number;
  currentAno: number;

  fetchCategories: (tipoVeiculo: string) => Promise<void>;
  fetchExpenses: (vehicleId: number, mes?: number, ano?: number) => Promise<void>;
  fetchSummary: (vehicleId: number, mes?: number, ano?: number) => Promise<void>;
  createExpense: (vehicleId: number, dto: CreateExpenseDTO) => Promise<Expense>;
  updateExpense: (vehicleId: number, expId: number, dto: Partial<CreateExpenseDTO>) => Promise<void>;
  deleteExpense: (vehicleId: number, expId: number) => Promise<void>;
  setMonth: (mes: number, ano: number) => void;
  clear: () => void;
}

export const useExpenseStore = create<ExpenseState>((set, get) => {
  const now = new Date();
  return {
    expenses: [],
    categories: [],
    summary: null,
    isLoading: false,
    error: null,
    currentMes: now.getMonth() + 1,
    currentAno: now.getFullYear(),

    fetchCategories: async (tipoVeiculo) => {
      try {
        const { data } = await api.get<ExpenseCategory[]>(`/expense-categories?tipo=${tipoVeiculo}`);
        set({ categories: data });
      } catch (err: any) {
        set({ error: err?.response?.data?.error ?? 'Erro ao carregar categorias' });
      }
    },

    fetchExpenses: async (vehicleId, mes, ano) => {
      const m = mes ?? get().currentMes;
      const a = ano ?? get().currentAno;
      set({ isLoading: true, error: null });
      try {
        const { data } = await api.get<Expense[]>(`/vehicles/${vehicleId}/expenses?mes=${m}&ano=${a}`);
        set({ expenses: data });
      } catch (err: any) {
        set({ error: err?.response?.data?.error ?? 'Erro ao carregar gastos' });
      } finally {
        set({ isLoading: false });
      }
    },

    fetchSummary: async (vehicleId, mes, ano) => {
      const m = mes ?? get().currentMes;
      const a = ano ?? get().currentAno;
      try {
        const { data } = await api.get<ExpenseSummary>(`/vehicles/${vehicleId}/expenses/summary?mes=${m}&ano=${a}`);
        set({ summary: data });
      } catch (err: any) {
        set({ error: err?.response?.data?.error ?? 'Erro ao carregar resumo' });
      }
    },

    createExpense: async (vehicleId, dto) => {
      set({ isLoading: true, error: null });
      try {
        const { data } = await api.post<Expense>(`/vehicles/${vehicleId}/expenses`, dto);
        set((s) => ({ expenses: [data, ...s.expenses] }));
        return data;
      } catch (err: any) {
        const msg = err?.response?.data?.error ?? 'Erro ao registrar gasto';
        set({ error: msg });
        throw err;
      } finally {
        set({ isLoading: false });
      }
    },

    updateExpense: async (vehicleId, expId, dto) => {
      const { data } = await api.put<Expense>(`/vehicles/${vehicleId}/expenses/${expId}`, dto);
      set((s) => ({
        expenses: s.expenses.map((e) => (e.id === expId ? data : e)),
      }));
    },

    deleteExpense: async (vehicleId, expId) => {
      await api.delete(`/vehicles/${vehicleId}/expenses/${expId}`);
      set((s) => ({ expenses: s.expenses.filter((e) => e.id !== expId) }));
    },

    setMonth: (mes, ano) => set({ currentMes: mes, currentAno: ano }),

    clear: () => set({ expenses: [], categories: [], summary: null }),
  };
});
