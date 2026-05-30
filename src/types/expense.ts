export interface ExpenseCategory {
  id: number;
  nome: string;
  icone: string | null;
  tipoVeiculo: 'todos' | 'carro' | 'moto' | 'caminhao' | 'van';
  ativo: boolean;
}

export interface Expense {
  id: number;
  vehicleId: number;
  categoryId: number;
  category: ExpenseCategory;
  valor: string; // decimal retorna como string no JSON
  data: string;  // 'YYYY-MM-DD'
  descricao: string | null;
  kmAtual: number | null;
  litros: string | null;
  precoLitro: string | null;
  tipoCombustivel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseDTO {
  categoryId: number;
  valor: number;
  data: string;
  descricao?: string;
  kmAtual?: number;
  litros?: number;
  precoLitro?: number;
  tipoCombustivel?: string;
}

export interface ExpenseSummary {
  mes: number;
  ano: number;
  total: number;
  quantidade: number;
  porCategoria: { nome: string; icone: string | null; total: number }[];
}

export const FUEL_TYPES = ['Gasolina', 'Etanol', 'Flex', 'Diesel', 'GNV', 'Elétrico'];
