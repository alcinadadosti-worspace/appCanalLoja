#!/usr/bin/env node
/*
 * update-historico.cjs
 * --------------------------------------------------------------------------
 * Roda na GitHub Action a cada push do acumulo.csv. Lê o acumulo, calcula os
 * totais da rede e ACRESCENTA um snapshot datado em historico.json.
 *
 * O histórico é a fonte CONFIÁVEL e COMPARTILHADA da série temporal: captura
 * toda atualização (3x/dia), independente de quem abre o painel. O app lê esse
 * arquivo, detecta a virada de ciclo sozinho (queda do acumulado) e deriva
 * venda do dia, acumulado/ritmo do ciclo e projeção.
 *
 * Datas em fuso local (TZ definido no workflow, ex.: America/Maceio).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const P = require(path.join(__dirname, '..', 'parseGerencial.js'));

const ROOT = path.join(__dirname, '..');
const CSV = path.join(ROOT, 'acumulo.csv');
const HIST = path.join(ROOT, 'historico.json');

function localDateISO(d) {
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function main() {
  if (!fs.existsSync(CSV)) { console.error('acumulo.csv não encontrado — nada a fazer.'); return; }
  const rows = P.parseGerencial(fs.readFileSync(CSV), null);
  if (!rows.length) { console.error('acumulo.csv sem lojas — ignorado.'); return; }
  const t = P.computeNetworkTotal(rows);

  const now = new Date();
  const date = localDateISO(now);

  let hist = { updatedAt: null, snapshots: [] };
  try { const j = JSON.parse(fs.readFileSync(HIST, 'utf8')); if (j && Array.isArray(j.snapshots)) hist = j; } catch (_) {}

  const snap = {
    ts: now.toISOString(),
    date: date,
    gmv: t.gmv,
    receitaLiquida: t.receitaLiquida,
    qtdBoletos: t.qtdBoletos,
    descontos: t.descontos,
    fidelidadeQtd: t.fidelidadeQtd,
    fidelidadePenetracao: t.fidelidadePenetracao
  };

  // Evita duplicar quando o conteúdo não mudou em relação ao último snapshot.
  const last = hist.snapshots[hist.snapshots.length - 1];
  if (last && last.gmv === snap.gmv && last.qtdBoletos === snap.qtdBoletos && last.date === snap.date) {
    console.log('Sem mudança desde o último snapshot — historico.json mantido.');
    return;
  }

  hist.snapshots.push(snap);
  if (hist.snapshots.length > 3000) hist.snapshots = hist.snapshots.slice(-3000);
  hist.updatedAt = now.toISOString();

  fs.writeFileSync(HIST, JSON.stringify(hist, null, 2) + '\n');
  console.log('Snapshot gravado:', date, 'GMV', snap.gmv, '· total de pontos:', hist.snapshots.length);
}

main();
