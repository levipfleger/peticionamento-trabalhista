/**
 * build-template.mjs
 *
 * Reads template-base.docx, replaces Word form fields (FORMTEXT + REF)
 * with docxtemplater {placeholder} syntax, and saves as template-carmes.docx.
 *
 * Run from the project root:
 *   node scripts/build-template.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import PizZip from 'pizzip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INPUT_PATH = join(__dirname, '..', 'public', 'template-base.docx');
const OUTPUT_PATH = join(__dirname, '..', 'public', 'template-carmes.docx');

console.log('Reading:', INPUT_PATH);

const docxBuffer = readFileSync(INPUT_PATH);
const zip = new PizZip(docxBuffer);

let xml = zip.files['word/document.xml'].asText();
console.log('Original XML size:', xml.length, 'bytes');

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: minimal plain run with a docxtemplater placeholder
// ─────────────────────────────────────────────────────────────────────────────
function plainRun(placeholder) {
  return (
    `<w:r><w:rPr>` +
    `<w:rFonts w:ascii="Arial Narrow" w:hAnsi="Arial Narrow" w:cs="Arial Narrow"/>` +
    `<w:sz w:val="24"/><w:szCs w:val="24"/>` +
    `<w:lang w:val="pt-BR"/>` +
    `</w:rPr>` +
    `<w:t xml:space="preserve">${placeholder}</w:t>` +
    `</w:r>`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE: index-based field block extractor
// Finds the run that contains a given fldChar begin (identified by a unique
// string inside it), then scans forward counting begin/end depth to find
// the matching fldChar end run. Returns {blockStart, blockEnd} indices.
// ─────────────────────────────────────────────────────────────────────────────
function findFieldBlock(xmlContent, beginRunStart) {
  // beginRunStart is the index of '<w:r' that starts the begin run.
  // Find the fldChar begin marker inside it.
  const beginMarker = xmlContent.indexOf('w:fldCharType="begin"', beginRunStart);
  if (beginMarker < 0) return null;

  // Find the end of this opening run
  const openRunEnd = xmlContent.indexOf('</w:r>', beginMarker);
  if (openRunEnd < 0) return null;
  const openRunEndPos = openRunEnd + 6;

  // Scan forward counting begin/end depth
  let depth = 1;
  let pos = openRunEndPos;

  while (pos < xmlContent.length && depth > 0) {
    const nextBegin = xmlContent.indexOf('w:fldCharType="begin"', pos);
    const nextEnd   = xmlContent.indexOf('w:fldCharType="end"',   pos);

    if (nextEnd < 0) return null; // malformed

    if (nextBegin >= 0 && nextBegin < nextEnd) {
      depth++;
      pos = nextBegin + 21;
    } else {
      depth--;
      if (depth === 0) {
        const endRunClose = xmlContent.indexOf('</w:r>', nextEnd);
        if (endRunClose < 0) return null;
        return { blockStart: beginRunStart, blockEnd: endRunClose + 6 };
      }
      pos = nextEnd + 20;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: Replace FORMTEXT form fields
// Identify each field by: <w:fldChar w:fldCharType="begin"><w:ffData>...<w:name w:val="FIELDNAME"/>
// ─────────────────────────────────────────────────────────────────────────────
const FORMTEXT_FIELDS = {
  nome:        '{nome}',
  rua:         '{endereco}',
  bairro:      '{bairro}',
  cidade:      '{cidade}',
  cep:         '{cep}',
  ddd:         '{tel_res_ddd}',
  fone:        '{tel_res_num}',
  Texto3:      '{tel_com_ddd}',
  Texto4:      '{tel_com_num}',
  Texto5:      '{tel_cel_ddd}',
  Texto6:      '{tel_cel_num}',
  Texto7:      '{tel_rec_ddd}',
  Texto8:      '{tel_rec_num}',
  Texto9:      '{email}',
  profissao:   '{profissao}',
  nacionalidade: '{nacionalidade}',
  Texto11:     '{nascimento}',
  estadocivil: '{estado_civil}',
  cpf:         '{cpf}',
  rg:          '{rg}',
  CTPS:        '{ctps}',
  NIT:         '{nome_mae}',
  Texto14:     '{honorarios}',
  Dropdown4:   '{forma_pagamento}',
  Texto57:     '{responsavel}',
  empresa:     '{empresa_nome}',
  data01:      '{data_hoje}',
};

console.log('\nReplacing FORMTEXT fields...');

function replaceAllFormTextFields(xmlContent, fieldMap) {
  // We'll do a single pass through all fields, collecting all replacement
  // positions and then applying them in reverse order (to preserve indices).

  const replacements = []; // [{start, end, replacement}]

  for (const [fieldName, placeholder] of Object.entries(fieldMap)) {
    // Find all occurrences of this field's ffData signature
    const needle = `<w:name w:val="${fieldName}"/>`;
    let searchFrom = 0;

    while (true) {
      const needlePos = xmlContent.indexOf(needle, searchFrom);
      if (needlePos < 0) break;

      // Find the run start by looking back for <w:r (should be within the fldChar begin run)
      const runStart = xmlContent.lastIndexOf('<w:r', needlePos);
      if (runStart < 0) { searchFrom = needlePos + needle.length; continue; }

      const block = findFieldBlock(xmlContent, runStart);
      if (!block) { searchFrom = needlePos + needle.length; continue; }

      replacements.push({
        start: block.blockStart,
        end: block.blockEnd,
        replacement: plainRun(placeholder),
        label: fieldName,
      });

      searchFrom = block.blockEnd;
    }
  }

  // Also collect bookmarkStart/End wrappers to remove
  const bmReplacements = [];
  for (const fieldName of Object.keys(fieldMap)) {
    const bmStartNeedle = `w:name="${fieldName}"`;
    let pos = 0;
    while (true) {
      const idx = xmlContent.indexOf(`<w:bookmarkStart`, pos);
      if (idx < 0) break;
      const endIdx = xmlContent.indexOf('/>', idx);
      if (endIdx < 0) break;
      const tag = xmlContent.substring(idx, endIdx + 2);
      if (tag.includes(bmStartNeedle)) {
        bmReplacements.push({ start: idx, end: endIdx + 2, replacement: '', label: 'bmStart:' + fieldName });
      }
      pos = endIdx + 2;
    }
  }

  // Merge all replacements and sort by start position
  const allReplacements = [...replacements, ...bmReplacements];
  allReplacements.sort((a, b) => a.start - b.start);

  // Remove overlaps (keep first in case of overlap)
  const filtered = [];
  let lastEnd = 0;
  for (const r of allReplacements) {
    if (r.start >= lastEnd) {
      filtered.push(r);
      lastEnd = r.end;
    }
  }

  // Apply replacements
  let result = '';
  let cursor = 0;
  for (const r of filtered) {
    result += xmlContent.slice(cursor, r.start);
    result += r.replacement;
    cursor = r.end;
  }
  result += xmlContent.slice(cursor);

  // Count replacements per field
  const counts = {};
  for (const r of filtered) {
    if (r.label) counts[r.label] = (counts[r.label] || 0) + 1;
  }
  for (const [k, v] of Object.entries(counts)) {
    if (!k.startsWith('bm')) {
      console.log(`  [${k}]: ${v} replacement(s)`);
    }
  }

  return result;
}

let modified = replaceAllFormTextFields(xml, FORMTEXT_FIELDS);
console.log('XML size after FORMTEXT replacements:', modified.length, 'bytes');

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: Replace REF field blocks
// Identify each REF field by its instrText content: " REF  fieldName "
// ─────────────────────────────────────────────────────────────────────────────
const REF_FIELDS = {
  nome:          '{nome}',
  nacionalidade: '{nacionalidade}',
  estadocivil:   '{estado_civil}',
  profissao:     '{profissao}',
  cpf:           '{cpf}',
  rg:            '{rg}',
  CTPS:          '{ctps}',
  rua:           '{endereco}',
  bairro:        '{bairro}',
  cidade:        '{cidade}',
  cep:           '{cep}',
  empresa:       '{empresa_nome}',
  data01:        '{data_hoje}',
};

console.log('\nReplacing REF fields...');

function replaceAllRefFields(xmlContent, refMap) {
  const replacements = [];

  for (const [refName, placeholder] of Object.entries(refMap)) {
    // instrText needle (the REF instruction)
    const needle = `REF  ${refName} `;
    const needle2 = `REF  ${refName}  `; // some have double space
    let searchFrom = 0;

    while (true) {
      let instrPos = xmlContent.indexOf(needle, searchFrom);
      if (instrPos < 0) instrPos = xmlContent.indexOf(needle2, searchFrom);
      if (instrPos < 0) break;

      // Find the opening fldChar begin run - it should be within a few runs before the instrText
      // Look backwards for fldCharType="begin" that doesn't have ffData (REF fields don't have ffData)
      let lookback = instrPos;
      let beginRunStart = -1;

      // Search backwards for the fldChar begin associated with this REF
      // It should be the most recent w:fldCharType="begin" before the instrText
      // that is NOT already consumed by a replacement
      const searchWindow = xmlContent.substring(Math.max(0, instrPos - 2000), instrPos);
      const lastBeginInWindow = searchWindow.lastIndexOf('w:fldCharType="begin"');
      if (lastBeginInWindow >= 0) {
        const absoluteBeginPos = Math.max(0, instrPos - 2000) + lastBeginInWindow;
        // Find the run start
        beginRunStart = xmlContent.lastIndexOf('<w:r', absoluteBeginPos);
      }

      if (beginRunStart < 0 || beginRunStart < searchFrom) {
        searchFrom = instrPos + needle.length;
        continue;
      }

      // Make sure this begin doesn't have ffData (that would be a FORMTEXT not REF)
      const beginContent = xmlContent.substring(beginRunStart, xmlContent.indexOf('</w:r>', beginRunStart) + 6);
      if (beginContent.includes('<w:ffData>')) {
        // This is a FORMTEXT begin, skip
        searchFrom = instrPos + needle.length;
        continue;
      }

      const block = findFieldBlock(xmlContent, beginRunStart);
      if (!block) {
        searchFrom = instrPos + needle.length;
        continue;
      }

      // Don't add duplicate ranges
      if (!replacements.some(r => r.start === block.blockStart)) {
        replacements.push({
          start: block.blockStart,
          end: block.blockEnd,
          replacement: plainRun(placeholder),
          label: refName,
        });
      }

      searchFrom = block.blockEnd;
    }
  }

  // Sort and apply
  replacements.sort((a, b) => a.start - b.start);

  // Remove overlaps
  const filtered = [];
  let lastEnd = 0;
  for (const r of replacements) {
    if (r.start >= lastEnd) {
      filtered.push(r);
      lastEnd = r.end;
    }
  }

  let result = '';
  let cursor = 0;
  for (const r of filtered) {
    result += xmlContent.slice(cursor, r.start);
    result += r.replacement;
    cursor = r.end;
  }
  result += xmlContent.slice(cursor);

  // Count per field
  const counts = {};
  for (const r of filtered) {
    counts[r.label] = (counts[r.label] || 0) + 1;
  }
  for (const [k, v] of Object.entries(counts)) {
    console.log(`  REF [${k}]: ${v} replacement(s)`);
  }

  return result;
}

modified = replaceAllRefFields(modified, REF_FIELDS);
console.log('XML size after REF replacements:', modified.length, 'bytes');

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: Consolidate split telephone fields
// After step 1, tel fields appear as: "({tel_res_ddd}) {tel_res_num}"
// We need to merge the ddd run, separator run, and number run into one.
// ─────────────────────────────────────────────────────────────────────────────

console.log('\nConsolidating telephone fields...');

function consolidateTelField(xmlContent, dddPH, sepText, numPH, finalPH) {
  // Find the ddd placeholder run, then scan forward to find the separator and num placeholder
  let result = '';
  let searchFrom = 0;
  let count = 0;

  while (true) {
    const dddPos = xmlContent.indexOf(`>${dddPH}</w:t>`, searchFrom);
    if (dddPos < 0) break;

    // Find start of the ddd run
    const dddRunStart = xmlContent.lastIndexOf('<w:r', dddPos);
    if (dddRunStart < searchFrom) { searchFrom = dddPos + 1; continue; }

    // Find end of the ddd run
    const dddRunEnd = xmlContent.indexOf('</w:r>', dddPos) + 6;

    // Look ahead up to 3000 chars for the separator text and num placeholder
    const lookAhead = xmlContent.substring(dddRunEnd, dddRunEnd + 3000);

    // Find separator text in the lookahead
    const sepIdx = lookAhead.indexOf(`>${sepText}</w:t>`);
    if (sepIdx < 0) { searchFrom = dddRunEnd; continue; }

    // Find the run containing the separator
    const sepRunStart = lookAhead.lastIndexOf('<w:r', sepIdx);
    const sepRunEnd = lookAhead.indexOf('</w:r>', sepIdx) + 6;

    // Find the num placeholder after the separator
    const afterSep = lookAhead.indexOf(`>${numPH}</w:t>`, sepIdx);
    if (afterSep < 0) { searchFrom = dddRunEnd; continue; }

    const numRunStart = lookAhead.lastIndexOf('<w:r', afterSep);
    const numRunEnd = lookAhead.indexOf('</w:r>', afterSep) + 6;

    // Replace from dddRunStart to (dddRunEnd + numRunEnd) with finalPH
    const absoluteEnd = dddRunEnd + numRunEnd;

    result += xmlContent.slice(searchFrom, dddRunStart);
    result += plainRun(finalPH);
    searchFrom = absoluteEnd;
    count++;
  }

  result += xmlContent.slice(searchFrom);
  console.log(`  ${dddPH} + ${numPH} → ${finalPH}: ${count} consolidation(s)`);
  return result;
}

modified = consolidateTelField(modified, '{tel_res_ddd}', ') ', '{tel_res_num}', '{tel_residencial}');
modified = consolidateTelField(modified, '{tel_com_ddd}', ') ', '{tel_com_num}', '{tel_comercial}');
modified = consolidateTelField(modified, '{tel_cel_ddd}', ') ', '{tel_cel_num}', '{tel_celular}');
modified = consolidateTelField(modified, '{tel_rec_ddd}', ') ', '{tel_rec_num}', '{tel_recado}');

// Check for unconsolidated orphans
const orphans = ['{tel_res_ddd}','{tel_res_num}','{tel_com_ddd}','{tel_com_num}','{tel_cel_ddd}','{tel_cel_num}','{tel_rec_ddd}','{tel_rec_num}'];
for (const o of orphans) {
  if (modified.includes(o)) console.log(`  WARNING: still present: ${o}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4: Verify all expected placeholders
// ─────────────────────────────────────────────────────────────────────────────

console.log('\nVerifying placeholders...');
const expected = [
  'nome','cpf','rg','ctps','estado_civil','nascimento','nacionalidade',
  'profissao','endereco','bairro','cidade','cep',
  'tel_residencial','tel_comercial','tel_celular','tel_recado',
  'email','nome_mae',
  'empresa_nome',
  'honorarios','forma_pagamento','responsavel',
  'data_hoje',
];

let allOk = true;
for (const p of expected) {
  const count = (modified.match(new RegExp(`\\{${p}\\}`, 'g')) || []).length;
  const status = count > 0 ? `${count}x OK` : 'MISSING!';
  if (count === 0) allOk = false;
  console.log(`  {${p}}: ${status}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5: Write output
// ─────────────────────────────────────────────────────────────────────────────

console.log('\nWriting to zip...');
zip.file('word/document.xml', modified);

const output = zip.generate({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: { level: 6 },
});

writeFileSync(OUTPUT_PATH, output);
console.log(`Done! Saved to: ${OUTPUT_PATH}`);
console.log(`Output size: ${output.length} bytes`);
if (!allOk) {
  console.log('\nWARNING: Some placeholders were not found. Review the output.');
  process.exit(1);
}
