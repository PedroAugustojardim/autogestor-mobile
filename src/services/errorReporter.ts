import axios from 'axios';
import { getAccessToken } from './secureTokenStorage';
import { BASE_URL, MOBILE_USER_AGENT } from './api';

// Reporta erro JS não capturado pra API (POST /client-errors), que repassa pro
// Sentry do lado do servidor — o app não tem o SDK nativo do Sentry (bare RN,
// exigiria build nativo novo pros testers). Tudo aqui é best-effort: nunca lança,
// nunca reporta a si mesmo, nunca dispara refresh/logout.
//
// Usa axios cru (não a instância `api`) de propósito: o interceptor de 401 de
// `api` tenta refresh e chama clearTokens() se falhar — um erro reportado com a
// sessão já expirada não pode ter esse efeito colateral.
//
// Limitação conhecida: só reporta com sessão ativa (sem token não dá pra
// autenticar o POST), então crash na tela de login/registro não chega aqui.
const DEDUPE_WINDOW_MS = 60_000;
const recentlyReported = new Map<string, number>();
let reporting = false;

export async function reportClientError(error: unknown, context?: string): Promise<void> {
  if (reporting) return;
  try {
    const err = error instanceof Error ? error : new Error(String(error));
    const message = (err.message || 'Erro sem mensagem').slice(0, 500);

    const key = `${message}|${context ?? ''}`;
    const now = Date.now();
    const last = recentlyReported.get(key);
    if (last !== undefined && now - last < DEDUPE_WINDOW_MS) return;
    if (recentlyReported.size > 50) recentlyReported.clear();
    recentlyReported.set(key, now);

    reporting = true;
    const token = await getAccessToken();
    if (!token) return;

    await axios.post(
      `${BASE_URL}/client-errors`,
      { message, stack: err.stack?.slice(0, 4000), platform: 'mobile', context },
      { headers: { Authorization: `Bearer ${token}`, 'User-Agent': MOBILE_USER_AGENT }, timeout: 5000 },
    );
  } catch {
    // Nunca propaga — um reporter que quebra o app seria pior que não ter reporter.
  } finally {
    reporting = false;
  }
}
