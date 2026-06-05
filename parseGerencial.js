/*
 * parseGerencial.js — MÓDULO CANÔNICO do parser GerencialVendas.
 * Usado pela GitHub Action (Node) e ESPELHADO na cópia inline do index.html
 * (1º <script>). Se mudar a lógica de parse, atualize OS DOIS.
 */
'use strict';
/**
 * parseGerencial.js
 * ------------------------------------------------------------------
 * Parser do relatório "GerencialVendas" da rede O Boticário / ACQUA.
 *
 * Formato do arquivo (respeitado exatamente aqui):
 *   - Nome: GerencialVendas-DD-MM-AAAA.csv  (a DATA está no nome)
 *   - Separador de colunas: ";"
 *   - Números BR: milhar com "." e decimal com ","  (ex.: 2.074,17 -> 2074.17)
 *   - Encoding UTF-8 COM BOM (\uFEFF removido antes de parsear)
 *   - Cabeçalho em 2 níveis unidos por hífen: "Grupo-Subcoluna"
 *   - Percentuais vêm como número (ex.: 81,82 == 81,82%)
 *
 * Este módulo funciona tanto em Node (module.exports) quanto no
 * navegador (window.GerencialParser), para servir de fonte única
 * de verdade para o backend e para o painel offline.
 * ------------------------------------------------------------------
 */

/** PDV (código do ponto de venda) -> nome amigável da loja. */
const STORE_MAP = {
  '24303': 'São Sebastião',
  '24617': 'Palmeira (Sustentável)',
  '24668': 'Palmeira',
  '24669': 'Penedo',
  '24670': 'Coruripe',
  '24671': 'Teotônio',
};

/**
 * Colunas usadas. A chave é o nome interno do campo; o valor é o
 * cabeçalho EXATO ("Grupo-Subcoluna") como aparece no CSV.
 * As colunas de "Meta" são ignoradas de propósito (vêm vazias).
 */
const COLS = {
  loja:                      'Listar Por Lojas',
  gmv:                       'GMV-GMV',
  boletoMedio:               'GMV-Boleto médio',
  qtdBoletos:                'GMV-Qtd de boletos',
  itensBoleto:               'GMV-Itens por boleto',
  receitaLiquida:            'Valores de vendas-Receita líquida',
  receitaLiquidaMenosTrocas: 'Valores de vendas-Receita líquida (-) trocas',
  b1Valor:                   'Valores de vendas-B1',
  fidelidadeQtd:             'Fidelidade-Qtd de boletos',
  fidelidadePenetracao:      'Fidelidade-Penetração boletos',
  descontos:                 'Descontos-Total de descontos',
  trocasValor:               'Trocas-Trocas',
  trocasQtd:                 'Trocas-Qtd de trocas',
  recargaCartaoPresente:     'Cartão presente-Recarga',
  b1Qtd:                     'Quantitativo-B1',
};

/** Campos que devem ser inteiros (contagens). */
const INT_FIELDS = new Set(['qtdBoletos', 'fidelidadeQtd', 'trocasQtd', 'b1Qtd']);

/** Normaliza um cabeçalho para casamento robusto (trim + colapsa espaços). */
function normHeader(s) {
  return String(s == null ? '' : s).replace(/\uFEFF/g, '').trim().replace(/\s+/g, ' ');
}

/**
 * Divide uma linha de CSV pelo separador ";" respeitando campos entre aspas
 * duplas (que podem conter ";" e aspas escapadas como ""). Mais robusto que
 * um simples split(';') caso uma raz\u00E3o social traga o separador embutido.
 */
function splitCSV(line) {
  const out = [];
  let cur = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ';') {
      out.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

/**
 * Converte um número no padrão BR ("2.074,17") para float (2074.17).
 * Campos vazios/nulos viram null (não quebra o parser).
 */
function brToFloat(value) {
  if (value == null) return null;
  const s = String(value).trim();
  if (s === '') return null;
  // Remove separador de milhar "." e troca a vírgula decimal por ".".
  const normalized = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}

/** Converte para inteiro (a partir do número BR); null permanece null. */
function brToInt(value) {
  const n = brToFloat(value);
  return n == null ? null : Math.round(n);
}

/**
 * Extrai a data (AAAA-MM-DD) a partir do nome do arquivo
 * "GerencialVendas-DD-MM-AAAA.csv". Retorna null se não casar.
 */
function parseDataFromFilename(filename) {
  if (!filename) return null;
  const base = String(filename).split(/[\\/]/).pop(); // só o nome
  const m = base.match(/(\d{2})-(\d{2})-(\d{4})/);
  if (!m) return null;
  const [, dd, mm, aaaa] = m;
  return `${aaaa}-${mm}-${dd}`;
}

/** Normaliza o conteúdo recebido (Buffer / Uint8Array / ArrayBuffer / string) para string UTF-8 sem BOM. */
function toText(input) {
  let text;
  if (input == null) {
    text = '';
  } else if (typeof input === 'string') {
    text = input;
  } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(input)) {
    text = input.toString('utf8');
  } else if (input instanceof Uint8Array || (typeof ArrayBuffer !== 'undefined' && input instanceof ArrayBuffer)) {
    const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : input;
    if (typeof TextDecoder !== 'undefined') {
      text = new TextDecoder('utf-8').decode(bytes);
    } else {
      text = Buffer.from(bytes).toString('utf8');
    }
  } else {
    text = String(input);
  }
  // Remove BOM no início, se houver.
  return text.replace(/^\uFEFF/, '');
}

/**
 * parseGerencial(csvBuffer, data)
 * @param {Buffer|Uint8Array|ArrayBuffer|string} csvBuffer  conteúdo do CSV
 * @param {string} [data]  data ISO (AAAA-MM-DD). Como a data está no NOME
 *                         do arquivo (e não no conteúdo), o chamador deve
 *                         passá-la aqui. Use parseDataFromFilename(nome).
 * @returns {Array<Object>} 1 objeto por loja, no schema documentado.
 */
function parseGerencial(csvBuffer, data) {
  const text = toText(csvBuffer);
  const lines = text.split(/\r\n|\r|\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return [];

  // Cabeçalho -> índice de coluna (casamento normalizado).
  const headerCells = splitCSV(lines[0]).map(normHeader);
  const headerIndex = {};
  headerCells.forEach((h, i) => {
    if (!(h in headerIndex)) headerIndex[h] = i; // mantém o 1º em caso de duplicata
  });

  // Resolve o índice de cada coluna que precisamos.
  const idx = {};
  for (const key of Object.keys(COLS)) {
    const target = normHeader(COLS[key]);
    const i = headerIndex[target];
    if (i === undefined) {
      throw new Error(
        `Coluna obrigatória não encontrada no CSV: "${COLS[key]}". ` +
        `Cabeçalhos disponíveis: ${headerCells.join(' | ')}`
      );
    }
    idx[key] = i;
  }

  const dataISO = data || null;
  const rows = [];

  for (let r = 1; r < lines.length; r++) {
    const cells = splitCSV(lines[r]);
    const get = (key) => {
      const c = cells[idx[key]];
      return c === undefined ? '' : c;
    };

    // 1ª coluna: "PDV - razão social"
    const lojaRaw = String(get('loja')).trim();
    if (lojaRaw === '') continue; // linha sem loja: ignora
    const parts = lojaRaw.split(' - ');
    const pdv = parts[0].trim();
    const razaoSocial = parts.slice(1).join(' - ').trim();

    rows.push({
      pdv,
      // nome amigável (usado no painel). Mantemos a razão social em razaoSocial.
      nome: STORE_MAP[pdv] || razaoSocial || pdv,
      razaoSocial,
      gmv:                       brToFloat(get('gmv')),
      boletoMedio:               brToFloat(get('boletoMedio')),
      qtdBoletos:                brToInt(get('qtdBoletos')),
      itensBoleto:               brToFloat(get('itensBoleto')),
      receitaLiquida:            brToFloat(get('receitaLiquida')),
      receitaLiquidaMenosTrocas: brToFloat(get('receitaLiquidaMenosTrocas')),
      b1Valor:                   brToFloat(get('b1Valor')),
      fidelidadeQtd:             brToInt(get('fidelidadeQtd')),
      fidelidadePenetracao:      brToFloat(get('fidelidadePenetracao')),
      descontos:                 brToFloat(get('descontos')),
      trocasValor:               brToFloat(get('trocasValor')),
      trocasQtd:                 brToInt(get('trocasQtd')),
      recargaCartaoPresente:     brToFloat(get('recargaCartaoPresente')),
      b1Qtd:                     brToInt(get('b1Qtd')),
      data: dataISO,
    });
  }

  return rows;
}

/** Soma segura (ignora null). */
function sum(rows, key) {
  return rows.reduce((acc, r) => acc + (typeof r[key] === 'number' ? r[key] : 0), 0);
}

/**
 * computeNetworkTotal(rows) -> objeto "TOTAL DA REDE".
 *  - Valores em R$ e contagens: somados.
 *  - Boleto médio: ponderado = ΣGMV / Σqtd de boletos.
 *  - Itens por boleto: ponderado = Σ(itens×boletos) / Σboletos.
 *  - Penetração fidelidade: ponderada = Σboletos_fid / Σboletos_totais,
 *    onde boletos_totais por loja é reconstruído da própria penetração
 *    (fid / (pen/100)), pois a base da penetração NÃO é "Qtd de boletos"
 *    do GMV (ver loja 24668: 18 fid e 81,82% => base 22, não 16).
 */
function computeNetworkTotal(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const gmv = sum(rows, 'gmv');
  const qtdBoletos = sum(rows, 'qtdBoletos');
  const fidelidadeQtd = sum(rows, 'fidelidadeQtd');

  // Itens totais reconstruídos (itens por boleto é média, não soma).
  const itensTotais = rows.reduce((acc, r) => {
    if (typeof r.itensBoleto === 'number' && typeof r.qtdBoletos === 'number') {
      return acc + r.itensBoleto * r.qtdBoletos;
    }
    return acc;
  }, 0);

  // Penetração ponderada da rede: usa SÓ as lojas com penetração informada
  // (pen > 0), somando numerador (fid) e base do MESMO conjunto. Assim uma
  // loja sem base conhecida não infla o índice ao entrar só no numerador.
  let fidNumPen = 0, baseFidelidade = 0;
  rows.forEach((r) => {
    const fid = typeof r.fidelidadeQtd === 'number' ? r.fidelidadeQtd : 0;
    const pen = typeof r.fidelidadePenetracao === 'number' ? r.fidelidadePenetracao : 0;
    if (pen > 0) { fidNumPen += fid; baseFidelidade += Math.round(fid / (pen / 100)); }
  });

  return {
    pdv: 'TOTAL',
    nome: 'TOTAL DA REDE',
    razaoSocial: '',
    gmv,
    boletoMedio: qtdBoletos > 0 ? gmv / qtdBoletos : null,
    qtdBoletos,
    itensBoleto: qtdBoletos > 0 ? itensTotais / qtdBoletos : null,
    receitaLiquida: sum(rows, 'receitaLiquida'),
    receitaLiquidaMenosTrocas: sum(rows, 'receitaLiquidaMenosTrocas'),
    b1Valor: sum(rows, 'b1Valor'),
    fidelidadeQtd,
    fidelidadePenetracao: baseFidelidade > 0 ? (fidNumPen / baseFidelidade) * 100 : null,
    descontos: sum(rows, 'descontos'),
    trocasValor: sum(rows, 'trocasValor'),
    trocasQtd: sum(rows, 'trocasQtd'),
    recargaCartaoPresente: sum(rows, 'recargaCartaoPresente'),
    b1Qtd: sum(rows, 'b1Qtd'),
    data: rows[0] && rows[0].data ? rows[0].data : null,
    _isTotal: true,
  };
}

const api = { parseGerencial, brToFloat, brToInt, parseDataFromFilename, computeNetworkTotal, STORE_MAP, COLS };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}
if (typeof window !== 'undefined') {
  window.GerencialParser = api;
}

