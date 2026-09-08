export interface MonthlyPoint {
  mes: number;
  ano: number;
  label: string;
  total: number;
  quantidade: number;
}

export interface CategoryReport {
  nome: string;
  icone: string | null;
  total: number;
  percentual: number;
}

export interface CategoryReportResponse {
  mes: number;
  ano: number;
  total: number;
  categorias: CategoryReport[];
}

// TypeORM/MySQL retorna DECIMAL como string no JSON — usar Number() para calcular
export interface FuelHistoricoItem {
  id: number;
  data: string;         // 'YYYY-MM-DD'
  litros: string | null;
  precoLitro: string | null;
  valor: string;
  kmAtual: number | null;
  tipoCombustivel: string | null;
}

export interface FuelReport {
  abastecimentos: number;
  totalLitros: number;
  totalGasto: number;
  precoMedioLitro: number;
  kmPorLitro: number | null;
  historico: FuelHistoricoItem[];
}

export interface YearMes {
  mes: number;
  label: string;
  total: number;
  quantidade: number;
}

export interface YearSummary {
  ano: number;
  totalAno: number;
  meses: YearMes[];
}

export interface PdfReportGasto {
  data: string;
  categoria: string;
  descricao: string | null;
  valor: number;
}

export interface PdfReportData {
  veiculo: {
    tipo: string;
    marca: string;
    modelo: string;
    ano: number | null;
    apelido: string | null;
  };
  periodo: { mes: number; ano: number; label: string };
  total: number;
  quantidade: number;
  categorias: CategoryReport[];
  gastos: PdfReportGasto[];
  geradoEm: string;
}
