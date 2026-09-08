import { useCallback, useEffect, useRef, useState } from 'react';

interface UsePollUntilOptions<T> {
  intervalMs: number;
  maxAttempts: number;
  fetcher: () => Promise<T>;
  isDone: (result: T) => boolean;
  onDone: (result: T) => void;
  // erroredLastAttempt diferencia "esgotou tentativas por causa de erro de rede
  // repetido" (silencioso, tenta de novo mais tarde) de "esgotou porque o
  // resultado nunca ficou 'pronto'" (o chamador normalmente avisa o usuário) —
  // mesma distinção que o polling original de PlanosScreen fazia.
  onMaxAttempts: (erroredLastAttempt: boolean) => void;
}

// Polling auto-agendado (setTimeout recursivo, não setInterval) — nunca duas
// checagens em voo ao mesmo tempo se a rede estiver lenta. Pensado pra "servidor
// vai atualizar via webhook/job assíncrono e eu preciso saber quando" (hoje:
// confirmação de pagamento do Mercado Pago em PlanosScreen).
export function usePollUntil<T>({
  intervalMs, maxAttempts, fetcher, isDone, onDone, onMaxAttempts,
}: UsePollUntilOptions<T>) {
  const [isPolling, setIsPolling] = useState(false);
  // Guarda contra uma resposta em voo chegar depois que o consumidor já parou o
  // polling (cancelamento do usuário, desmontagem da tela) — sem isso, callbacks
  // podem disparar "do nada" numa tela que não é mais a que iniciou o polling.
  const activeRef = useRef(false);
  const attemptsRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    activeRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const start = useCallback(() => {
    activeRef.current = true;
    attemptsRef.current = 0;
    setIsPolling(true);

    const tick = async () => {
      if (!activeRef.current) return;
      attemptsRef.current += 1;
      let erroredThisTick = false;
      try {
        const result = await fetcher();
        if (!activeRef.current) return;
        if (isDone(result)) {
          stop();
          onDone(result);
          return;
        }
      } catch {
        if (!activeRef.current) return;
        erroredThisTick = true;
      }
      if (attemptsRef.current >= maxAttempts) {
        stop();
        onMaxAttempts(erroredThisTick);
        return;
      }
      timeoutRef.current = setTimeout(tick, intervalMs);
    };

    timeoutRef.current = setTimeout(tick, intervalMs);
  }, [fetcher, isDone, onDone, onMaxAttempts, intervalMs, maxAttempts, stop]);

  useEffect(() => () => stop(), [stop]);

  return { isPolling, start, stop };
}
