export type VehicleType = 'carro' | 'moto' | 'caminhao' | 'van';

export interface Vehicle {
  id: number;
  tipo: VehicleType;
  marca: string;
  modelo: string;
  ano: number | null;
  placa: string | null;
  renavam: string | null;
  cor: string | null;
  apelido: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleDTO {
  tipo: VehicleType;
  marca: string;
  modelo: string;
  ano?: number;
  cor?: string;
  apelido?: string;
}

export const VEHICLE_LABELS: Record<VehicleType, string> = {
  carro: 'Carro',
  moto: 'Moto',
  caminhao: 'Caminhão',
  van: 'Van',
};

export const VEHICLE_ICONS: Record<VehicleType, string> = {
  carro: '🚗',
  moto: '🏍️',
  caminhao: '🚛',
  van: '🚐',
};
