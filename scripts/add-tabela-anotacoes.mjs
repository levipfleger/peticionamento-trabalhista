/**
 * add-tabela-anotacoes.mjs
 *
 * Injeta no template-carmes.docx (documento de cadastro) uma tabela
 * "ANOTAÇÕES DO CASO" logo ABAIXO da tabela de dados de cadastro (Tabela 1) e
 * ANTES do page break que leva à procuração — de modo que fica na mesma página.
 *
 * - Um parágrafo espaçador (que sobrevive à renderização) separa visualmente a
 *   tabela de anotações da tabela de cadastro (senão o Word funde as duas).
 * - A caixa de conteúdo tem o placeholder {anotacoes} + 3 linhas em branco,
 *   para sempre dar a impressão de espaço sobrando.
 * - Tudo envolto em {#tem_anotacoes}...{/tem_anotacoes}: sem anotações, nada é
 *   renderizado (documento idêntico ao atual).
 *
 * Idempotente / re-executável: se o bloco já existe, ele é removido e re-inserido.
 *
 * Uso: node scripts/add-tabela-anotacoes.mjs [saida.docx]
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import PizZip from 'pizzip';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INPUT = join(__dirname, '..', 'public', 'template-documentos', 'template-carmes.docx');
const OUTPUT = process.argv[2] || INPUT;

const rPrTitulo = '<w:rPr><w:rFonts w:ascii="Arial Narrow" w:hAnsi="Arial Narrow" w:cs="Arial Narrow"/><w:b/><w:bCs/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr>';
const rPrTexto = '<w:rPr><w:rFonts w:ascii="Arial Narrow" w:hAnsi="Arial Narrow" w:cs="Arial Narrow"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>';
const borda = 'w:val="single" w:sz="4" w:space="0" w:color="auto"';
const pVazio = `<w:p><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/>${rPrTexto}</w:pPr></w:p>`;

const BLOCO =
  `<w:p><w:r><w:t>{#tem_anotacoes}</w:t></w:r></w:p>` +
  // espaçador: separa a tabela de anotações da tabela de cadastro (evita fusão)
  pVazio +
  `<w:tbl>` +
    `<w:tblPr>` +
      `<w:tblW w:w="10636" w:type="dxa"/>` +
      `<w:tblInd w:w="93" w:type="dxa"/>` +
      `<w:tblBorders>` +
        `<w:top ${borda}/><w:left ${borda}/><w:bottom ${borda}/><w:right ${borda}/>` +
        `<w:insideH ${borda}/><w:insideV ${borda}/>` +
      `</w:tblBorders>` +
      `<w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>` +
    `</w:tblPr>` +
    `<w:tblGrid><w:gridCol w:w="10636"/></w:tblGrid>` +
    // linha 1 — título
    `<w:tr><w:tc>` +
      `<w:tcPr><w:tcW w:w="10636" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>` +
      `<w:p><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/>${rPrTitulo}</w:pPr>` +
        `<w:r>${rPrTitulo}<w:t>ANOTAÇÕES DO CASO</w:t></w:r></w:p>` +
    `</w:tc></w:tr>` +
    // linha 2 — conteúdo + 3 linhas em branco (ilusão de espaço sobrando)
    `<w:tr><w:tc>` +
      `<w:tcPr><w:tcW w:w="10636" w:type="dxa"/></w:tcPr>` +
      `<w:p><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="both"/>${rPrTexto}</w:pPr>` +
        `<w:r>${rPrTexto}<w:t xml:space="preserve">{anotacoes}</w:t></w:r></w:p>` +
      pVazio + pVazio + pVazio +
    `</w:tc></w:tr>` +
  `</w:tbl>` +
  `<w:p><w:r><w:t>{/tem_anotacoes}</w:t></w:r></w:p>`;

const zip = new PizZip(readFileSync(INPUT));
let xml = zip.file('word/document.xml').asText();

// Remove um bloco antigo, se existir (re-executável / atualiza o design)
const oi = xml.indexOf('{#tem_anotacoes}');
if (oi >= 0) {
  const blockStart = xml.lastIndexOf('<w:p>', oi);
  const ci = xml.indexOf('{/tem_anotacoes}', oi);
  const blockEnd = xml.indexOf('</w:p>', ci) + 6;
  if (blockStart < 0 || ci < 0) { console.error('ABORTADO: bloco antigo malformado.'); process.exit(1); }
  xml = xml.slice(0, blockStart) + xml.slice(blockEnd);
  console.log('Bloco de anotações anterior removido.');
}

// Ponto de inserção: logo após o </w:tbl> da PRIMEIRA tabela (cadastro)
const t1end = xml.indexOf('</w:tbl>') + 8;
if (t1end < 8) { console.error('ABORTADO: tabela de cadastro não encontrada.'); process.exit(1); }
const depois = xml.slice(t1end, t1end + 400);
if (!/<w:br w:type="page"\/>/.test(depois)) {
  console.error('ABORTADO: page break esperado após a tabela de cadastro não encontrado. Contexto:', JSON.stringify(depois.slice(0, 120)));
  process.exit(1);
}
console.log('Ponto de inserção OK (após tabela de cadastro, antes do page break).');

xml = xml.slice(0, t1end) + BLOCO + xml.slice(t1end);

zip.file('word/document.xml', xml);
writeFileSync(OUTPUT, zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }));
console.log(`Tabela "ANOTAÇÕES DO CASO" (separada + linhas em branco) injetada. Salvo: ${OUTPUT}`);
