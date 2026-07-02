/**
 * remove-notas-vermelhas.mjs
 *
 * Remove as anotações internas de redação do template-at.docx:
 *   - "(REQUERIMENTO REFERENTE AO PONTO X)" (indicador de referência)
 *   - "(DEVE CONSTAR/ESTAR PRESENTE EM TODAS AS PETIÇÕES)"
 * e limpa o realce VERMELHO que sobrar (inclusive em marca de parágrafo).
 *
 * A remoção é feita por PADRÃO DE TEXTO (não por cor), distribuída pelos runs,
 * para pegar também notas com realce misto (parte vermelha, parte não). Só as
 * frases exatas acima são removidas — nenhum requerimento ou valor é tocado.
 *
 * Segurança: valida que todo texto em VERMELHO é uma dessas notas (se sobrar
 * palavra fora do padrão, aborta). Depois confere que a contagem de
 * requerimentos/seções/parágrafos e os realces amarelos não mudaram.
 *
 * Uso: node scripts/remove-notas-vermelhas.mjs [saida.docx]
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import PizZip from 'pizzip';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INPUT = join(__dirname, '..', 'public', 'template-at', 'template-at.docx');
const OUTPUT = process.argv[2] || INPUT;

const NOTA_PATTERNS = [
  / ?\(\s*REQUERIMENTO REFERENTE AO PONTO[^)]*\)/gi,
  / ?\(\s*DEVE (?:CONSTAR|ESTAR PRESENTE) EM TODAS AS PETI[ÇC][ÕO]ES\s*\)/gi,
];

const zip = new PizZip(readFileSync(INPUT));
let xml = zip.file('word/document.xml').asText();

const visText = (x) => [...x.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map(m => m[1]).join('');
const count = (x, re) => (x.match(re) || []).length;

// ── 1. Segurança: todo texto em VERMELHO deve ser uma dessas notas ──
const RUN_RE = /<w:r[ >][\s\S]*?<\/w:r>/g;
const redText = (xml.match(RUN_RE) || [])
  .filter(r => /<w:highlight w:val="red"\/>/.test(r))
  .map(r => [...r.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map(m => m[1]).join(''))
  .join('');
let residuo = redText
  .replace(/\(?\s*REQUERIMENTO REFERENTE AO PONTO(?:[\s\d]|E PONTO)*\)?/gi, '')
  .replace(/\(?\s*DEVE (?:CONSTAR|ESTAR PRESENTE) EM TODAS AS PETI[ÇC][ÕO]ES\)?/gi, '')
  .replace(/[\s().,;:]/g, '');
if (residuo !== '') {
  console.error('ABORTADO: texto em vermelho fora do padrão de nota:', JSON.stringify(residuo.slice(0, 200)));
  process.exit(1);
}
console.log('Validação: todo texto vermelho é nota editorial ✓');

// ── 2. Contagens ANTES ──
const antes = {
  paras: count(xml, /<w:p[ >]/g),
  req: count(xml, /<w:numId w:val="5"\/>/g),
  sec: count(xml, /<w:numId w:val="9"\/>/g),
  amarelo: count(xml, /<w:highlight w:val="yellow"\/>/g),
};

// ── 3. Remove as notas por texto, parágrafo a parágrafo ──
function limparPara(paraXml) {
  const tRe = /(<w:t\b[^>]*>)([\s\S]*?)(<\/w:t>)/g;
  const items = []; let m;
  while ((m = tRe.exec(paraXml)) !== null) items.push({ open: m[1], text: m[2], close: m[3], start: m.index, end: tRe.lastIndex });
  if (!items.length) return { xml: paraXml, notas: [] };

  let concat = ''; const owner = [];
  items.forEach((it, k) => { for (let c = 0; c < it.text.length; c++) owner.push(k); concat += it.text; });

  const del = new Array(concat.length).fill(false);
  const notas = [];
  for (const re of NOTA_PATTERNS) {
    re.lastIndex = 0; let mm;
    while ((mm = re.exec(concat)) !== null) {
      notas.push(mm[0].trim());
      for (let c = mm.index; c < mm.index + mm[0].length; c++) del[c] = true;
    }
  }
  if (!notas.length) return { xml: paraXml, notas: [] };

  const novo = items.map(() => '');
  for (let c = 0; c < concat.length; c++) if (!del[c]) novo[owner[c]] += concat[c];

  let out = '', cursor = 0;
  for (let k = 0; k < items.length; k++) {
    out += paraXml.slice(cursor, items[k].start) + items[k].open + novo[k] + items[k].close;
    cursor = items[k].end;
  }
  out += paraXml.slice(cursor);
  return { xml: out, notas };
}

const partes = xml.split(/(?=<w:p[ >])/); // mantém delimitador
let totalNotas = 0;
const amostra = [];
for (let i = 0; i < partes.length; i++) {
  if (!/^<w:p[ >]/.test(partes[i])) continue;
  const r = limparPara(partes[i]);
  if (r.notas.length) { totalNotas += r.notas.length; if (amostra.length < 4) amostra.push(...r.notas.slice(0, 1)); partes[i] = r.xml; }
}
xml = partes.join('');

// ── 4. Limpa realce vermelho residual (marca de parágrafo / runs esvaziados) ──
const redResidual = count(xml, /<w:highlight w:val="red"\/>/g);
xml = xml.replace(/<w:highlight w:val="red"\/>/g, '');

// ── 5. Contagens/verificações DEPOIS ──
const depois = {
  paras: count(xml, /<w:p[ >]/g),
  req: count(xml, /<w:numId w:val="5"\/>/g),
  sec: count(xml, /<w:numId w:val="9"\/>/g),
  amarelo: count(xml, /<w:highlight w:val="yellow"\/>/g),
};
const vis = visText(xml);
const sobrouNota = /REQUERIMENTO REFERENTE AO PONTO|DEVE (?:CONSTAR|ESTAR PRESENTE) EM TODAS/i.test(vis);
const sobrouVermelho = /<w:highlight w:val="red"\/>/.test(xml);

console.log(`Notas removidas (por texto): ${totalNotas}`);
console.log('  exemplos:', amostra.map(a => JSON.stringify(a)).join('  '));
console.log(`Realce vermelho residual limpo: ${redResidual}`);
console.log(`Parágrafos:   ${antes.paras} → ${depois.paras} ${antes.paras===depois.paras?'✓':'✗'}`);
console.log(`Requerimentos ${antes.req} → ${depois.req} ${antes.req===depois.req?'✓':'✗'}`);
console.log(`Seções:       ${antes.sec} → ${depois.sec} ${antes.sec===depois.sec?'✓':'✗'}`);
console.log(`Amarelos:     ${antes.amarelo} → ${depois.amarelo} ${antes.amarelo===depois.amarelo?'✓':'✗'}`);
console.log(`Sobrou texto de nota? ${sobrouNota ? '✗ SIM' : '✓ não'}`);
console.log(`Sobrou vermelho?      ${sobrouVermelho ? '✗ SIM' : '✓ não'}`);

if (antes.paras!==depois.paras || antes.req!==depois.req || antes.sec!==depois.sec || antes.amarelo!==depois.amarelo || sobrouNota || sobrouVermelho) {
  console.error('\n✗ Verificação falhou — NÃO vou salvar.');
  process.exit(1);
}

zip.file('word/document.xml', xml);
writeFileSync(OUTPUT, zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }));
console.log(`\n✓ Salvo: ${OUTPUT}`);
