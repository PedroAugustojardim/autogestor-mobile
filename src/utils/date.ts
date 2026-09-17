export function todayLocalISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MESES_COMPLETO = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

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

// "YYYY-MM-DD" -> "Hoje" / "Ontem" / "N dias atrás" (até 6 dias) / "DD/MM/YYYY" caindo pro
// formato padrão depois disso — usado nas listas curtas de "últimos gastos" da Home.
export function formatRelativeDateBR(dateStr: string): string {
  const diff = daysBetween(dateStr);
  if (diff === 0) return 'Hoje';
  if (diff === -1) return 'Ontem';
  if (diff < -1 && diff >= -6) return `${Math.abs(diff)} dias atrás`;
  return formatDateBR(dateStr);
}

// "YYYY-MM-DD" -> "HOJE" / "ONTEM" / "D DE MÊS" (maiúsculo) — cabeçalho de grupo por dia,
// usado na lista de Gastos.
export function formatDayGroupLabel(dateStr: string): string {
  const diff = daysBetween(dateStr);
  if (diff === 0) return 'HOJE';
  if (diff === -1) return 'ONTEM';
  const [, m, d] = dateStr.split('-');
  return `${Number(d)} DE ${MESES_COMPLETO[Number(m) - 1]}`.toUpperCase();
}

// Fração (0–1) já decorrida entre `startISO` (datetime ISO) e `targetDateStr` ('YYYY-MM-DD'),
// medida a partir de hoje — usado pra estimar o progresso de um lembrete de manutenção sem
// depender de odômetro (o veículo não tem um campo de quilometragem atual rastreado).
export function elapsedFraction(startISO: string, targetDateStr: string): number {
  const start = new Date(startISO);
  start.setHours(0, 0, 0, 0);
  const [y, m, d] = targetDateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const total = target.getTime() - start.getTime();
  if (total <= 0) return 1;
  const elapsed = today.getTime() - start.getTime();
  return Math.min(1, Math.max(0, elapsed / total));
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
