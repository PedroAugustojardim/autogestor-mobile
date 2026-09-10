export function todayLocalISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// "YYYY-MM-DD" -> "DD/MM/YYYY". Formato usado por data de manutenção, lembrete e gasto.
export function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// "YYYY-MM-DD" -> "DD/Mon" (nome do mês abreviado) — usado nos cards de Consultas SP.
export function formatDateShortBR(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${d}/${MESES_ABREV[Number(m) - 1]}`;
}

// ISO datetime completo -> "DD/MM/YYYY às HH:mm" — usado nas notificações.
export function formatDateTimeBR(iso: string): string {
  const d = new Date(iso);
  const data = d.toLocaleDateString('pt-BR');
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${data} às ${hora}`;
}

// Dias entre hoje e "YYYY-MM-DD" — positivo = data no futuro, negativo = já passou.
// Zera as horas dos dois lados antes de subtrair pra não variar com o horário atual.
export function daysBetween(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}
