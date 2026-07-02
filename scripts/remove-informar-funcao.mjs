/**
 * remove-informar-funcao.mjs
 *
 * Remove a anotação interna "(INFORMAR FUNÇÃO)," (grifada em amarelo) do
 * corpo da seção de Insalubridade – Limpeza de banheiro, deixando a frase
 * "...pela parte Autora, em especial as que envolviam limpeza...".
 *
 * Idempotente: se o trecho já foi removido, não faz nada.
 *
 * Uso: node scripts/remove-informar-funcao.mjs [saida.docx]
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import PizZip from 'pizzip';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INPUT = join(__dirname, '..', 'public', 'template-at', 'template-at.docx');
const OUTPUT = process.argv[2] || INPUT;

const zip = new PizZip(readFileSync(INPUT));
let xml = zip.file('word/document.xml').asText();

const marker = '<w:t>INFORMAR FUNÇÃO</w:t>';
const mPos = xml.indexOf(marker);
if (mPos < 0) {
  console.log('Nada a fazer: "(INFORMAR FUNÇÃO)" não encontrado (já removido?).');
  process.exit(0);
}

// Delimita o parágrafo que contém o marcador
const pStart = xml.lastIndexOf('<w:p ', mPos);
const pEnd = xml.indexOf('</w:p>', mPos) + 6;
const para = xml.slice(pStart, pEnd);

// Tokeniza os runs do parágrafo
const runRe = /<w:r[ >][\s\S]*?<\/w:r>/g;
const runs = [];
let m;
while ((m = runRe.exec(para)) !== null) {
  const txt = [...m[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map(x => x[1]).join('');
  runs.push({ xml: m[0], txt, start: m.index, end: runRe.lastIndex });
}

const idxInform = runs.findIndex(r => r.txt === 'INFORMAR FUNÇÃO');
const idxParen = idxInform - 1;
const idxComma = idxInform + 1;
const idxAutora = idxParen - 1;

// Validação defensiva: confirma o padrão exato antes de mexer
const okPadrao =
  idxAutora >= 0 &&
  runs[idxAutora].txt === 'Autora ' &&
  runs[idxParen].txt === '(' &&
  runs[idxComma].txt === '),' &&
  runs[idxParen].xml.includes('<w:highlight w:val="yellow"/>') &&
  runs[idxInform].xml.includes('<w:highlight w:val="yellow"/>') &&
  runs[idxComma].xml.includes('<w:highlight w:val="yellow"/>');

if (!okPadrao) {
  console.error('ABORTADO: padrão de runs inesperado. Nada foi alterado.');
  console.error('  Autora=%o ( =%o INFORMAR=%o ),=%o',
    runs[idxAutora] && runs[idxAutora].txt, runs[idxParen] && runs[idxParen].txt,
    runs[idxInform] && runs[idxInform].txt, runs[idxComma] && runs[idxComma].txt);
  process.exit(1);
}

// Novo run: "Autora," (sem realce — herda a formatação do run original de "Autora ")
const autoraRunNovo = runs[idxAutora].xml.replace('>Autora </w:t>', '>Autora,</w:t>');

// Reconstrói o parágrafo substituindo os 4 runs [Autora .. ),] pelo único run "Autora,"
const novoPara =
  para.slice(0, runs[idxAutora].start) +
  autoraRunNovo +
  para.slice(runs[idxComma].end);

xml = xml.slice(0, pStart) + novoPara + xml.slice(pEnd);

zip.file('word/document.xml', xml);
writeFileSync(OUTPUT, zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }));
console.log('OK: "(INFORMAR FUNÇÃO)," removido; frase agora começa "...parte Autora, em especial...".');
console.log('Salvo:', OUTPUT);
