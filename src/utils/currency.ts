// "R$ X,XX" no padrão pt-BR — usado em Gastos, Manutenção, Relatórios e Consultas.
export function formatCurrencyBRL(value: string | number): string {
  return `R$ ${Number(value).toFixed(2).replace('.', ',')}`;
}
