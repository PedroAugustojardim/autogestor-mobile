import { VehicleType } from './vehicle';

export interface Maintenance {
  id: number;
  vehicleId: number;
  tipo: string;
  data: string; // 'YYYY-MM-DD'
  km: number | null;
  custo: string | null; // decimal retorna como string no JSON
  descricao: string | null;
  createdAt: string;
}

export interface Reminder {
  id: number;
  vehicleId: number;
  maintenanceId: number | null;
  tipo: string;
  dataPrevista: string; // 'YYYY-MM-DD'
  silenciado: boolean;
  concluido: boolean;
  createdAt: string;
}

export interface CreateMaintenanceDTO {
  tipo: string;
  data: string;
  km?: number;
  custo?: number;
  descricao?: string;
  criarLembrete?: { tipo: string; dataPrevista: string };
}

// Tipos de manutenção comuns a todos os veículos + extras específicos por tipo,
// mesmo espírito das categorias de gasto (comuns + por tipo de veículo).
const MAINTENANCE_TYPES_COMUNS = ['Troca de óleo', 'Revisão geral', 'Troca de filtro', 'Bateria', 'Alinhamento/Balanceamento'];

export const MAINTENANCE_TYPES: Record<VehicleType, string[]> = {
  carro: [...MAINTENANCE_TYPES_COMUNS, 'Troca de pneu', 'Freios', 'Suspensão', 'Outros'],
  moto: [...MAINTENANCE_TYPES_COMUNS, 'Corrente/Relação', 'Troca de pneu', 'Freios', 'Outros'],
  caminhao: [...MAINTENANCE_TYPES_COMUNS, 'Troca de pneu', 'Freios', 'Suspensão', 'Tacógrafo', 'Outros'],
  van: [...MAINTENANCE_TYPES_COMUNS, 'Troca de pneu', 'Freios', 'Suspensão', 'Outros'],
};
