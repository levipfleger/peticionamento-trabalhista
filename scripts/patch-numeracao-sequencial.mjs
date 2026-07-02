/**
 * patch-numeracao-sequencial.mjs
 *
 * Converte os números das seções (teses) e dos sub-itens que eram digitados
 * à mão no template-at.docx em numeração AUTOMÁTICA do Word, contínua com as
 * seções que já eram automáticas. Assim, quando o docxtemplater remove as
 * seções condicionais, o Word renumera tudo em ordem (1, 2, 3...).
 *
 * Também:
 *  - troca o formato da lista de seções de "01." (decimalZero) para "1." (decimal);
 *  - define o nível 2 da lista de seções como "N.M." (para o sub-item 33.1);
 *  - define o nível 2 da lista de requerimentos como "x.M)" (para pp.1 / pp.2).
 *
 * Idempotente: rodar de novo não causa dano (pula o que já foi convertido).
 *
 * Uso:
 *   node scripts/patch-numeracao-sequencial.mjs            (sobrescreve o template)
 *   node scripts/patch-numeracao-sequencial.mjs saida.docx (escreve em outro arquivo)
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import PizZip from 'pizzip';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INPUT = join(__dirname, '..', 'public', 'template-at', 'template-at.docx');
const OUTPUT = process.argv[2] || INPUT;

// ───────────────────────────────────────────────────────────────────────────
// Alvos: paraIds dos cabeçalhos de seção que eram numerados à mão.
// ───────────────────────────────────────────────────────────────────────────
const SECOES_ILVL0 = [
  '4B3BEFFB', // Repouso semanal
  '24FC6DD2', // Quebra de caixa
  '3B1B7606', // Aviso prévio
  '4BD71D54', // Multa 477
  '27526896', // Seguro-desemprego
  '03F7FD53', // Assédio moral
  '12D905CE', // Assédio sexual
  '562B70AD', // Dano moral CTPS
  '46DF76AD', // Insalubridade
  '734706BD', // Pausas térmicas
  '0EEE9F5C', // Reversão justa causa
  '2E291EBA', // Acidente
  '7A912804', // Doença ocupacional
  '5327AB8E', // Pensão mensal
  '62F93FFD', // Gestante
  '73610277', // Equiparação salarial
  '1F15982B', // Desvio de função
  '2941E596', // Limpeza de banheiro
  '3BA41865', // Periculosidade
  '1ADCCDD9', // FGTS
  '47FA2F88', // INSS
  '422ECD92', // Imposto de renda
  '29C11B00', // Honorários
  '66715711', // Honorários hipossuficiente
  '6F84C455', // Requerimentos
  '7A337AE4', // Disposições finais
];
const SECAO_SUB = '568888E9'; // 33.1 -> nível 2 da lista de seções (numId 9)
const REQ_SUB = ['247B0364', '471CAF2D']; // pp.1, pp.2 -> nível 2 da lista de requerimentos (numId 5)

const PREFIXO_SECAO = /^[\s ]*\d+(?:\.\d+)?\.?[ \t ]*/; // "18. " | "33.1. " | "28." | "45. "
const PREFIXO_REQ = /^[\s ]*pp\.\d\)[ \t ]*/;            // "pp.1) "

// ───────────────────────────────────────────────────────────────────────────
// Helpers de manipulação de parágrafo
// ───────────────────────────────────────────────────────────────────────────
function getParaBounds(xml, paraId) {
  const pos = xml.indexOf(`w14:paraId="${paraId}"`);
  if (pos < 0) return null;
  const start = xml.lastIndexOf('<w:p ', pos);
  const end = xml.indexOf('</w:p>', pos) + 6;
  return { start, end };
}

function ensurePPr(p) {
  if (/<w:pPr>/.test(p)) return p;
  return p.replace(/(<w:p\b[^>]*>)/, '$1<w:pPr></w:pPr>');
}

function ensureKeepNext(p) {
  if (/<w:keepNext\s*\/>/.test(p)) return p;
  if (/<w:pStyle\b[^>]*\/>/.test(p)) return p.replace(/(<w:pStyle\b[^>]*\/>)/, '$1<w:keepNext/>');
  return p.replace('<w:pPr>', '<w:pPr><w:keepNext/>');
}

function addNumPr(p, ilvl, numId) {
  if (/<w:numPr>/.test(p)) return p; // idempotente
  const numPr = `<w:numPr><w:ilvl w:val="${ilvl}"/><w:numId w:val="${numId}"/></w:numPr>`;
  if (/<w:keepNext\s*\/>/.test(p)) return p.replace(/(<w:keepNext\s*\/>)/, `$1${numPr}`);
  if (/<w:pStyle\b[^>]*\/>/.test(p)) return p.replace(/(<w:pStyle\b[^>]*\/>)/, `$1${numPr}`);
  return p.replace('<w:pPr>', `<w:pPr>${numPr}`);
}

function setInd(p, left, hanging) {
  const ind = `<w:ind w:left="${left}" w:hanging="${hanging}"/>`;
  if (/<w:ind\b[^>]*\/>/.test(p)) return p.replace(/<w:ind\b[^>]*\/>/, ind);
  if (/<w:jc\b[^>]*\/>/.test(p)) return p.replace(/(<w:jc\b[^>]*\/>)/, `${ind}$1`);
  return p.replace('</w:pPr>', `${ind}</w:pPr>`);
}

// Remove `prefixRegex` do início do texto concatenado dos <w:t>, distribuindo
// a remoção pelos primeiros <w:t> e preservando a formatação dos runs.
function stripLeadingText(p, prefixRegex) {
  const tRe = /(<w:t\b[^>]*>)([\s\S]*?)(<\/w:t>)/g;
  const items = [];
  let m;
  while ((m = tRe.exec(p)) !== null) {
    items.push({ open: m[1], text: m[2], close: m[3], start: m.index, end: tRe.lastIndex });
  }
  if (items.length === 0) return { xml: p, stripped: '' };
  const concat = items.map(i => i.text).join('');
  const pm = concat.match(prefixRegex);
  if (!pm || pm[0].length === 0) return { xml: p, stripped: '' }; // nada a remover (já feito)
  let toRemove = pm[0].length;
  const newTexts = items.map(i => i.text);
  for (let k = 0; k < items.length && toRemove > 0; k++) {
    if (newTexts[k].length <= toRemove) { toRemove -= newTexts[k].length; newTexts[k] = ''; }
    else { newTexts[k] = newTexts[k].slice(toRemove); toRemove = 0; }
  }
  let out = '', cursor = 0;
  for (let k = 0; k < items.length; k++) {
    out += p.slice(cursor, items[k].start) + items[k].open + newTexts[k] + items[k].close;
    cursor = items[k].end;
  }
  out += p.slice(cursor);
  return { xml: out, stripped: pm[0] };
}

function applyToPara(xml, paraId, fn) {
  const b = getParaBounds(xml, paraId);
  if (!b) { console.warn(`  WARN: paraId ${paraId} não encontrado`); return xml; }
  const para = xml.slice(b.start, b.end);
  const novo = fn(para);
  return xml.slice(0, b.start) + novo + xml.slice(b.end);
}

// ───────────────────────────────────────────────────────────────────────────
// numbering.xml
// ───────────────────────────────────────────────────────────────────────────
function patchNumbering(num) {
  function editAbstract(absId, fn) {
    const pos = num.indexOf(`w:abstractNumId="${absId}"`);
    if (pos < 0) { console.warn(`  WARN: abstract ${absId} não encontrado`); return; }
    const start = num.lastIndexOf('<w:abstractNum ', pos);
    const end = num.indexOf('</w:abstractNum>', pos) + 16;
    const block = num.slice(start, end);
    num = num.slice(0, start) + fn(block) + num.slice(end);
  }

  // abstract 15 (numId 9 — seções): ilvl0 decimalZero -> decimal; ilvl1 -> "%1.%2."
  editAbstract('15', (block) => {
    let b = block.replace('<w:numFmt w:val="decimalZero"/>', '<w:numFmt w:val="decimal"/>');
    b = b.replace(
      /<w:lvl w:ilvl="1"[\s\S]*?<\/w:lvl>/,
      '<w:lvl w:ilvl="1" w:tplc="04160019"><w:start w:val="1"/><w:numFmt w:val="decimal"/>' +
      '<w:lvlText w:val="%1.%2."/><w:lvlJc w:val="left"/>' +
      '<w:pPr><w:ind w:left="709" w:hanging="425"/></w:pPr>' +
      '<w:rPr><w:b/><w:i/></w:rPr></w:lvl>'
    );
    return b;
  });

  // abstract 17 (numId 5 — requerimentos): ilvl1 -> "%1.%2)"
  editAbstract('17', (block) =>
    block.replace(
      /<w:lvl w:ilvl="1"[\s\S]*?<\/w:lvl>/,
      '<w:lvl w:ilvl="1" w:tplc="04160019"><w:start w:val="1"/><w:numFmt w:val="decimal"/>' +
      '<w:lvlText w:val="%1.%2)"/><w:lvlJc w:val="left"/>' +
      '<w:pPr><w:ind w:left="3261" w:hanging="567"/></w:pPr></w:lvl>'
    )
  );

  return num;
}

// ───────────────────────────────────────────────────────────────────────────
// Execução
// ───────────────────────────────────────────────────────────────────────────
console.log('Lendo:', INPUT);
const zip = new PizZip(readFileSync(INPUT));
let doc = zip.file('word/document.xml').asText();
let num = zip.file('word/numbering.xml').asText();

console.log('\n[numbering.xml]');
num = patchNumbering(num);
console.log('  abstract15 ilvl0 ->', /w:abstractNumId="15"[\s\S]*?<w:numFmt w:val="decimal"\/>/.test(num) ? 'decimal OK' : 'FALHOU');
console.log('  abstract15 ilvl1 %1.%2. ->', num.includes('<w:lvlText w:val="%1.%2."/>') ? 'OK' : 'FALHOU');
console.log('  abstract17 ilvl1 %1.%2) ->', num.includes('<w:lvlText w:val="%1.%2)"/>') ? 'OK' : 'FALHOU');

console.log('\n[document.xml] Seções nível 0:');
for (const id of SECOES_ILVL0) {
  doc = applyToPara(doc, id, (para) => {
    let p = ensurePPr(para);
    p = ensureKeepNext(p);
    p = addNumPr(p, 0, 9);
    p = setInd(p, 284, 284);
    const r = stripLeadingText(p, PREFIXO_SECAO);
    console.log(`  ${id}: removido ${JSON.stringify(r.stripped)}`);
    return r.xml;
  });
}

console.log('\n[document.xml] Seção sub-item (33.1):');
doc = applyToPara(doc, SECAO_SUB, (para) => {
  let p = ensurePPr(para);
  p = addNumPr(p, 1, 9);
  const r = stripLeadingText(p, PREFIXO_SECAO);
  console.log(`  ${SECAO_SUB}: removido ${JSON.stringify(r.stripped)}`);
  return r.xml;
});

console.log('\n[document.xml] Requerimentos sub-itens (pp.1 / pp.2):');
for (const id of REQ_SUB) {
  doc = applyToPara(doc, id, (para) => {
    let p = ensurePPr(para);
    p = addNumPr(p, 1, 5);
    const r = stripLeadingText(p, PREFIXO_REQ);
    console.log(`  ${id}: removido ${JSON.stringify(r.stripped)}`);
    return r.xml;
  });
}

zip.file('word/document.xml', doc);
zip.file('word/numbering.xml', num);
const out = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
writeFileSync(OUTPUT, out);
console.log(`\nSalvo: ${OUTPUT} (${out.length} bytes)`);
