import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './secureTokenStorage';

const PROD_URL = 'https://autogestor-api-production.up.railway.app/api/v1';
const DEV_URL = 'http://10.0.2.2:3000/api/v1';
// Única fonte pra escolha de ambiente — performRefresh() faz uma chamada crua
// (fora da instância `api`) e precisa da mesma URL, sem reescrever o ternário.
const BASE_URL = __DEV__ ? DEV_URL : PROD_URL;

// User-Agent próprio: é assim que o backend decide se este cliente pode receber o
// refresh token no corpo da resposta (ver isTrustedMobileClient em
// autogestor-api/src/utils/clientDetection.ts) em vez de só no cookie httpOnly —
// nunca remover ou o refresh do mobile para de devolver o token no body.
const MOBILE_USER_AGENT = 'AutoGestorMobile/1.0';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': MOBILE_USER_AGENT,
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Leitura do Keychain falhou (ex.: chave invalidada) — segue sem o
      // header em vez de rejeitar a requisição inteira com uma exceção crua
      // do Keychain; sem token, o backend responde 401 normalmente.
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Compartilhado entre requisições concorrentes: se duas chamadas levarem 401 ao
// mesmo tempo (comum quando várias telas disparam requests em paralelo ao voltar
// pro app), só a primeira dispara o /auth/refresh — as demais aguardam a mesma
// promise em vez de cada uma tentar rotacionar o refresh token por conta própria.
let refreshPromise: Promise<string> | null = null;

function performRefresh(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await getRefreshToken();
      // Chamada crua (não via `api`) mas ainda precisa do User-Agent próprio —
      // sem ele o backend trata como cliente não-confiável e não devolve o
      // refresh token novo no body, quebrando a rotação (ver comentário acima).
      const { data } = await axios.post(
        `${BASE_URL}/auth/refresh`,
        { refreshToken },
        { headers: { 'User-Agent': MOBILE_USER_AGENT } },
      );
      // O backend rotaciona o refresh token a cada uso (o antigo é revogado) — se só o
      // access token novo for salvo aqui, o refresh seguinte reapresenta um token já
      // revogado, o que aciona a detecção de reuso e derruba a sessão inteira. Precisa
      // salvar os dois, igual login/register fazem via setTokens.
      await setTokens(data.accessToken, data.refreshToken);
      return data.accessToken as string;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await performRefresh();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.warn('[api] refresh token expirado — sessão encerrada', refreshError);
        await clearTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
