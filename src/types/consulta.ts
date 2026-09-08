export interface Fine {
  id: string;
  valor: number;
  data: string;
  descricao: string;
  orgao: string;
}

export interface IpvaParcela {
  numero: number;
  valor: number;
  vencimento: string;
  paga: boolean;
}

export interface IpvaResult {
  ano: number;
  valorTotal: number;
  parcelas: IpvaParcela[];
}

export interface DebtsResult {
  multas: { quantidade: number; valorTotal: number };
  ipva: { pendente: boolean; valorTotal: number };
  licenciamento: { vencimento: string; pendente: boolean };
}

export interface Recall {
  id: string;
  titulo: string;
  descricao: string;
}
