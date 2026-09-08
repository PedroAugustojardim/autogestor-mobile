import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import api from '../../services/api';
import { useVehicleStore } from '../../store/vehicleStore';
import { useReportStore } from '../../store/reportStore';
import { useAuthStore } from '../../store/authStore';
import { MonthlyPoint, CategoryReport, PdfReportData } from '../../types/report';
import { formatCurrencyBRL as formatCurrency } from '../../utils/currency';

// Categoria, descrição e apelido do veículo são texto livre do usuário — nunca interpolar
// direto no HTML sem escapar, ou um "<"/"&" na descrição de um gasto quebra a tabela do PDF.
function escapeHtml(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildReportHtml(data: PdfReportData): string {
  const veiculoNome = escapeHtml(data.veiculo.apelido ?? `${data.veiculo.marca} ${data.veiculo.modelo}`);
  const linhasCategorias = data.categorias.map((c) => `
    <tr>
      <td>${escapeHtml(c.icone ?? '')} ${escapeHtml(c.nome)}</td>
      <td style="text-align:right">${formatCurrency(c.total)}</td>
      <td style="text-align:right">${c.percentual}%</td>
    </tr>`).join('');
  const linhasGastos = data.gastos.map((g) => `
    <tr>
      <td>${g.data.split('-').reverse().join('/')}</td>
      <td>${escapeHtml(g.categoria)}</td>
      <td>${escapeHtml(g.descricao ?? '')}</td>
      <td style="text-align:right">${formatCurrency(g.valor)}</td>
    </tr>`).join('');

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #212121; padding: 24px; }
          h1 { color: #1B5E20; font-size: 22px; margin-bottom: 4px; }
          .sub { color: #757575; font-size: 13px; margin-bottom: 20px; }
          .total { font-size: 18px; font-weight: bold; color: #1B5E20; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { text-align: left; font-size: 11px; text-transform: uppercase; color: #9E9E9E; border-bottom: 1px solid #E0E0E0; padding: 6px 4px; }
          td { font-size: 13px; padding: 6px 4px; border-bottom: 1px solid #F5F5F5; }
          .footer { color: #9E9E9E; font-size: 10px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <h1>Relatório de Gastos — AutoGestor</h1>
        <div class="sub">${veiculoNome} · ${data.periodo.label}</div>
        <div class="total">Total do período: ${formatCurrency(data.total)} (${data.quantidade} gasto${data.quantidade === 1 ? '' : 's'})</div>

        <table>
          <thead><tr><th>Categoria</th><th style="text-align:right">Total</th><th style="text-align:right">%</th></tr></thead>
          <tbody>${linhasCategorias || '<tr><td colspan="3">Nenhum gasto no período</td></tr>'}</tbody>
        </table>

        <table>
          <thead><tr><th>Data</th><th>Categoria</th><th>Descrição</th><th style="text-align:right">Valor</th></tr></thead>
          <tbody>${linhasGastos || '<tr><td colspan="4">Nenhum gasto no período</td></tr>'}</tbody>
        </table>

        <div class="footer">Gerado em ${new Date(data.geradoEm).toLocaleString('pt-BR')} pelo AutoGestor</div>
      </body>
    </html>`;
}

const MESES_NOME = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Gráfico de barras simples (sem dependência externa)
function BarChart({ data }: { data: MonthlyPoint[] }) {
  const max = data.length > 0 ? Math.max(...data.map((d) => d.total), 1) : 1;
  return (
    <View style={chart.container}>
      {data.map((d, i) => (
        <View key={i} style={chart.col}>
          <Text style={chart.value}>
            {d.total > 0 ? `R$${d.total.toFixed(0)}` : ''}
          </Text>
          <View style={chart.barWrap}>
            <View style={[chart.bar, { height: Math.max((d.total / max) * 120, d.total > 0 ? 4 : 0) }]} />
          </View>
          <Text style={chart.label}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

// Barra de progresso para categorias
function CategoryBar({ cat, total }: { cat: CategoryReport; total: number }) {
  const pct = total > 0 ? cat.total / total : 0;
  return (
    <View style={catBar.row}>
      <Text style={catBar.icon}>{cat.icone ?? '📦'}</Text>
      <View style={{ flex: 1 }}>
        <View style={catBar.labelRow}>
          <Text style={catBar.nome} numberOfLines={1}>{cat.nome}</Text>
          <Text style={catBar.valor}>{formatCurrency(cat.total)}</Text>
        </View>
        <View style={catBar.track}>
          <View style={[catBar.fill, { width: `${Math.round(pct * 100)}%` }]} />
        </View>
        <Text style={catBar.pct}>{cat.percentual}%</Text>
      </View>
    </View>
  );
}

export function RelatoriosScreen() {
  const { activeVehicle } = useVehicleStore();
  const { user } = useAuthStore();
  const isPremium = user?.plano !== 'gratuito';
  const {
    monthly, categoryReport, fuelReport, yearSummary,
    isLoading, error,
    fetchMonthly, fetchByCategory, fetchFuel, fetchYearSummary,
  } = useReportStore();

  const [tab, setTab] = useState<'gastos' | 'categorias' | 'combustivel' | 'anual'>('gastos');
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const exportPdf = async () => {
    if (!activeVehicle) return;
    setExporting(true);
    try {
      const now = new Date();
      const { data } = await api.get<PdfReportData>(
        `/vehicles/${activeVehicle.id}/reports/pdf?mes=${now.getMonth() + 1}&ano=${now.getFullYear()}`,
      );
      const html = buildReportHtml(data);
      const file = await RNHTMLtoPDF.convert({
        html,
        fileName: `autogestor-relatorio-${data.periodo.mes}-${data.periodo.ano}`,
        directory: 'Documents',
      });
      if (!file.filePath) throw new Error('PDF não gerado');
      await Share.open({
        title: 'Relatório AutoGestor',
        url: `file://${file.filePath}`,
        type: 'application/pdf',
        failOnCancel: false,
      });
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.error ?? 'Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setExporting(false);
    }
  };

  const load = async () => {
    if (!activeVehicle) return;
    if (tab === 'gastos') await fetchMonthly(activeVehicle.id, 6);
    if (tab === 'categorias') await fetchByCategory(activeVehicle.id);
    if (tab === 'combustivel') await fetchFuel(activeVehicle.id, 6);
    if (tab === 'anual' && isPremium) await fetchYearSummary(activeVehicle.id);
  };

  useEffect(() => {
    load();
  }, [tab, activeVehicle]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (!activeVehicle) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🚗</Text>
        <Text style={styles.emptyTitle}>Nenhum veículo cadastrado</Text>
        <Text style={styles.emptySubtitle}>Cadastre um veículo para ver os relatórios</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B5E20" />}
    >
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Relatórios</Text>
            <Text style={styles.vehicle}>
              {activeVehicle.apelido ?? `${activeVehicle.marca} ${activeVehicle.modelo}`}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={exportPdf}
            disabled={exporting}
          >
            {exporting
              ? <ActivityIndicator color="#1B5E20" size="small" />
              : <Text style={styles.exportBtnText}>📄 Exportar PDF</Text>
            }
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['gastos', 'categorias', 'combustivel', 'anual'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'gastos' ? '📊 Gastos'
                : t === 'categorias' ? '🥧 Categ.'
                : t === 'combustivel' ? '⛽ Combust.'
                : `📅 Anual${isPremium ? '' : ' 🔒'}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && !refreshing && (
        <ActivityIndicator color="#1B5E20" style={{ marginTop: 40 }} />
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* ── TAB: GASTOS MENSAIS ── */}
      {tab === 'gastos' && !isLoading && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Gastos dos últimos 6 meses</Text>
          {monthly.length > 0 ? (
            <>
              <BarChart data={monthly} />
              <View style={styles.divider} />
              {monthly.map((m, i) => (
                <View key={i} style={styles.monthRow}>
                  <Text style={styles.monthLabel}>
                    {MESES_NOME[m.mes - 1]}/{String(m.ano).slice(2)}
                  </Text>
                  <Text style={styles.monthQtd}>{m.quantidade} gasto(s)</Text>
                  <Text style={[styles.monthTotal, m.total > 0 && styles.monthTotalRed]}>
                    {formatCurrency(m.total)}
                  </Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total período</Text>
                <Text style={styles.totalValor}>
                  {formatCurrency(monthly.reduce((s, m) => s + m.total, 0))}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.noData}>Nenhum gasto registrado nos últimos 6 meses</Text>
          )}
        </View>
      )}

      {/* ── TAB: POR CATEGORIA ── */}
      {tab === 'categorias' && !isLoading && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Distribuição por categoria —{' '}
            {categoryReport
              ? `${MESES_NOME[(categoryReport.mes ?? 1) - 1]}/${categoryReport.ano}`
              : 'este mês'}
          </Text>
          {categoryReport && categoryReport.categorias.length > 0 ? (
            <>
              <Text style={styles.totalMes}>
                Total: {formatCurrency(categoryReport.total)}
              </Text>
              <View style={styles.divider} />
              {categoryReport.categorias.map((cat, i) => (
                <CategoryBar key={i} cat={cat} total={categoryReport.total} />
              ))}
            </>
          ) : (
            <Text style={styles.noData}>Nenhum gasto registrado este mês</Text>
          )}
        </View>
      )}

      {/* ── TAB: COMBUSTÍVEL ── */}
      {tab === 'combustivel' && !isLoading && (
        <>
          {/* Cards de métricas */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricIcon}>⛽</Text>
              <Text style={styles.metricValue}>
                {fuelReport ? `${fuelReport.totalLitros.toFixed(1)}L` : '—'}
              </Text>
              <Text style={styles.metricLabel}>Litros abastecidos</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricIcon}>💰</Text>
              <Text style={styles.metricValue}>
                {fuelReport ? `R$${fuelReport.precoMedioLitro.toFixed(2)}` : '—'}
              </Text>
              <Text style={styles.metricLabel}>Preço médio/litro</Text>
            </View>
          </View>
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricIcon}>🛣️</Text>
              <Text style={styles.metricValue}>
                {fuelReport?.kmPorLitro ? `${fuelReport.kmPorLitro} km/L` : '—'}
              </Text>
              <Text style={styles.metricLabel}>Consumo médio</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricIcon}>🔢</Text>
              <Text style={styles.metricValue}>
                {fuelReport ? fuelReport.abastecimentos : '—'}
              </Text>
              <Text style={styles.metricLabel}>Abastecimentos</Text>
            </View>
          </View>

          {/* Histórico de abastecimentos */}
          {fuelReport && fuelReport.historico.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Histórico de abastecimentos</Text>
              {fuelReport.historico.slice().reverse().map((ab, i) => {
                const [y, m, d] = ab.data.split('-');
                return (
                  <View key={i} style={styles.abRow}>
                    <View>
                      <Text style={styles.abData}>{`${d}/${m}/${y}`}</Text>
                      {ab.tipoCombustivel && (
                        <Text style={styles.abTipo}>{ab.tipoCombustivel}</Text>
                      )}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.abValor}>{formatCurrency(Number(ab.valor))}</Text>
                      {ab.litros && (
                        <Text style={styles.abLitros}>{Number(ab.litros).toFixed(1)}L</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {fuelReport && fuelReport.historico.length === 0 && (
            <View style={styles.card}>
              <Text style={styles.noData}>Nenhum abastecimento registrado nos últimos 6 meses</Text>
            </View>
          )}
        </>
      )}

      {/* ── TAB: ANUAL (Premium) ── */}
      {tab === 'anual' && !isLoading && (
        !isPremium ? (
          <View style={styles.card}>
            <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>🔒</Text>
            <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#1B5E20', textAlign: 'center', marginBottom: 8 }}>
              Recurso Premium
            </Text>
            <Text style={{ fontSize: 14, color: '#757575', textAlign: 'center', marginBottom: 20, lineHeight: 20 }}>
              O resumo anual está disponível apenas no plano Premium. Faça upgrade para desbloquear.
            </Text>
            <TouchableOpacity style={{ backgroundColor: '#1B5E20', borderRadius: 8, paddingVertical: 12, alignItems: 'center' }} onPress={() => {}}>
              <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '700' }}>Ver planos Premium</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resumo anual {yearSummary?.ano}</Text>
            {yearSummary ? (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, color: '#757575' }}>Total do ano</Text>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1B5E20' }}>
                    {`R$ ${yearSummary.totalAno.toFixed(2).replace('.', ',')}`}
                  </Text>
                </View>
                <View style={styles.divider} />
                {yearSummary.meses.map((m, i) => (
                  <View key={i} style={styles.monthRow}>
                    <Text style={styles.monthLabel}>{m.label}</Text>
                    <Text style={styles.monthQtd}>{m.quantidade} gasto(s)</Text>
                    <Text style={[styles.monthTotal, m.total > 0 && styles.monthTotalRed]}>
                      {`R$ ${m.total.toFixed(2).replace('.', ',')}`}
                    </Text>
                  </View>
                ))}
              </>
            ) : (
              <Text style={styles.noData}>Carregando...</Text>
            )}
          </View>
        )
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5', padding: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1B5E20', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#757575', textAlign: 'center' },
  header: { backgroundColor: '#1B5E20', padding: 24, paddingTop: 56 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#FFF' },
  vehicle: { fontSize: 14, color: '#A5D6A7', marginTop: 4 },
  exportBtn: {
    backgroundColor: '#FFF', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12,
    minWidth: 130, alignItems: 'center', justifyContent: 'center',
  },
  exportBtnText: { color: '#1B5E20', fontSize: 12, fontWeight: '700' },
  tabs: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#1B5E20' },
  tabText: { fontSize: 12, color: '#9E9E9E', fontWeight: '600' },
  tabTextActive: { color: '#1B5E20' },
  card: { backgroundColor: '#FFF', borderRadius: 12, margin: 16, padding: 16, elevation: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#212121', marginBottom: 16 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
  monthRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  monthLabel: { width: 52, fontSize: 13, color: '#757575' },
  monthQtd: { flex: 1, fontSize: 12, color: '#9E9E9E' },
  monthTotal: { fontSize: 14, fontWeight: '600', color: '#212121' },
  monthTotalRed: { color: '#C62828' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  totalLabel: { fontSize: 14, fontWeight: '700', color: '#212121' },
  totalValor: { fontSize: 14, fontWeight: '700', color: '#1B5E20' },
  noData: { color: '#9E9E9E', textAlign: 'center', paddingVertical: 24 },
  errorBox: { margin: 16, padding: 12, backgroundColor: '#FFEBEE', borderRadius: 8 },
  errorText: { color: '#C62828', fontSize: 13 },
  totalMes: { fontSize: 18, fontWeight: 'bold', color: '#1B5E20', marginBottom: 12 },
  metricsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginTop: 16 },
  metricCard: {
    flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 16,
    alignItems: 'center', elevation: 1,
  },
  metricIcon: { fontSize: 28, marginBottom: 8 },
  metricValue: { fontSize: 18, fontWeight: 'bold', color: '#1B5E20', marginBottom: 4 },
  metricLabel: { fontSize: 11, color: '#757575', textAlign: 'center' },
  abRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  abData: { fontSize: 14, color: '#212121', fontWeight: '600' },
  abTipo: { fontSize: 12, color: '#757575', marginTop: 2 },
  abValor: { fontSize: 14, fontWeight: '700', color: '#C62828' },
  abLitros: { fontSize: 12, color: '#757575', marginTop: 2 },
});

const chart = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', height: 160, marginBottom: 8 },
  col: { flex: 1, alignItems: 'center' },
  barWrap: { height: 120, justifyContent: 'flex-end', width: '60%' },
  bar: { backgroundColor: '#1B5E20', borderRadius: 4, width: '100%' },
  value: { fontSize: 8, color: '#757575', marginBottom: 2 },
  label: { fontSize: 9, color: '#9E9E9E', marginTop: 4, textAlign: 'center' },
});

const catBar = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  icon: { fontSize: 22, marginRight: 10, marginTop: 2 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  nome: { fontSize: 13, color: '#212121', flex: 1, fontWeight: '500' },
  valor: { fontSize: 13, fontWeight: '700', color: '#212121', marginLeft: 8 },
  track: { height: 8, backgroundColor: '#E8F5E9', borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#1B5E20', borderRadius: 4 },
  pct: { fontSize: 10, color: '#9E9E9E', marginTop: 2 },
});
