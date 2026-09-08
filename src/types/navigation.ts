import { Expense } from './expense';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  App: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  VehicleRegister: undefined;
  Manutencao: undefined;
  NewMaintenance: { vehicleId: number };
  Notificacoes: undefined;
  Consultas: undefined;
};

export type GastosStackParamList = {
  GastosMain: undefined;
  NewExpense: { vehicleId: number };
  EditExpense: { expense: Expense; vehicleId: number };
};

export type PerfilStackParamList = {
  PerfilMain: undefined;
  EditarNome: undefined;
  AlterarSenha: undefined;
  Planos: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Gastos: undefined;
  Relatorios: undefined;
  Perfil: undefined;
};
