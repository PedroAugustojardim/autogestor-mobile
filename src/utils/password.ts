import { z } from 'zod';

// Política única para todo fluxo que define ou troca senha (cadastro, reset via
// email, alterar senha no perfil) — espelha as regras do backend (ver
// PLANO_SEGURANCA_AUTOGESTOR.md item 2 / auth.schema.ts em autogestor-api).
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
export const PASSWORD_UPPERCASE_REGEX = /[A-Z]/;
export const PASSWORD_DIGIT_REGEX = /[0-9]/;
export const PASSWORD_SYMBOL_REGEX = /[^A-Za-z0-9]/;

export const passwordSchema = z.string()
  .min(PASSWORD_MIN_LENGTH, `Mínimo ${PASSWORD_MIN_LENGTH} caracteres`)
  .max(PASSWORD_MAX_LENGTH, `Máximo ${PASSWORD_MAX_LENGTH} caracteres`)
  .regex(PASSWORD_UPPERCASE_REGEX, 'Precisa de 1 letra maiúscula')
  .regex(PASSWORD_DIGIT_REGEX, 'Precisa de 1 número')
  .regex(PASSWORD_SYMBOL_REGEX, 'Precisa de 1 símbolo');
