type ApiErrorBody = {
  error?: string;
  details?: { path?: string; message?: string }[];
};

// Mensagem pronta pra mostrar ao usuário a partir de uma falha da API.
//
// Quando o corpo é recusado pela validação, a API responde 400 com `error: "Dados inválidos"`
// E `details` com o motivo de cada campo (ex.: "Data: use o formato AAAA-MM-DD"). Mostrar só
// o `error` deixava a pessoa sem saber o que corrigir. Os detalhes já vêm em português e com o
// nome do campo (ver autogestor-api/src/schemas/errorMap.ts) — aqui só juntamos, sem repetir.
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: ApiErrorBody } } | null | undefined)?.response?.data;

  const rawDetails = data?.details;
  const details = Array.isArray(rawDetails)
    ? rawDetails
        .map((d) => d?.message)
        .filter((m): m is string => typeof m === 'string' && m.length > 0)
    : [];
  if (details.length > 0) {
    return [...new Set(details)].slice(0, 3).join('\n');
  }

  return data?.error || fallback;
}
