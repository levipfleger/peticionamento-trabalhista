import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import PizZip from 'pizzip';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = join(__dirname, '..', 'public', 'template-at', 'template-at.docx');

function uid() {
  return Math.random().toString(16).slice(2, 10).toUpperCase().padEnd(8, '0');
}

function makeTag(tag) {
  const id = uid();
  return `<w:p w14:paraId="${id}" w:rsidR="${id}"><w:pPr><w:rPr><w:vanish/></w:rPr></w:pPr><w:r><w:rPr><w:vanish/></w:rPr><w:t>{${tag}}</w:t></w:r></w:p>`;
}

function wrapParaId(xml, paraId, tag) {
  const idAttr = `w14:paraId="${paraId}"`;
  const pos = xml.indexOf(idAttr);
  if (pos < 0) {
    console.warn(`  WARN: paraId ${paraId} not found!`);
    return xml;
  }

  const pStart = xml.lastIndexOf('<w:p ', pos);
  if (pStart < 0) {
    console.warn(`  WARN: <w:p not found for paraId ${paraId}`);
    return xml;
  }

  const pEnd = xml.indexOf('</w:p>', pos);
  if (pEnd < 0) {
    console.warn(`  WARN: </w:p> not found for paraId ${paraId}`);
    return xml;
  }
  const pEndFull = pEnd + 6;

  return (
    xml.slice(0, pStart) +
    makeTag('#' + tag) + '\n' +
    xml.slice(pStart, pEndFull) + '\n' +
    makeTag('/' + tag) +
    xml.slice(pEndFull)
  );
}

const buf = readFileSync(TEMPLATE);
const zip = new PizZip(buf);
let xml = zip.file('word/document.xml').asText();

const toWrap = [
  // m, n, o — Pedido 14 (jornada)
  { paraId: '09CACF26', tag: 'jornada_ativa',               label: 'm'   },
  { paraId: '0877AC76', tag: 'jornada_ativa',               label: 'n'   },
  { paraId: '4ADB5090', tag: 'jornada_ativa',               label: 'o'   },
  // p, uu — Pedido 15 (intra)
  { paraId: '757A9532', tag: 'intra_ativa',                 label: 'p'   },
  { paraId: '0E68111F', tag: 'intra_ativa',                 label: 'uu'  },
  // q — Pedido 16 (inter)
  { paraId: '63B1B434', tag: 'jornada_inter_ativa',         label: 'q'   },
  // r — Pedido 17 (noturno)
  { paraId: '4BA08399', tag: 'noturno_ativo',               label: 'r'   },
  // s — Pedido 18 (repouso)
  { paraId: '6638DD56', tag: 'repouso_ativo',               label: 's'   },
  // t — Pedido 19 (caixa)
  { paraId: '667FA2B6', tag: 'caixa_ativo',                 label: 't'   },
  // u — Pedido 22 (seguro-desemprego)
  { paraId: '05030612', tag: 'seguro_desemprego_ativo',     label: 'u'   },
  // v — Pedido 21 (multa 477)
  { paraId: '5C6C3C93', tag: 'multa_477_ativa',             label: 'v'   },
  // w — sem condicional (sempre presente), skip
  // y — Pedido 26 (vinculo dano moral CTPS)
  { paraId: '7E7DDFF6', tag: 'vinculo_ativo',               label: 'y'   },
  // z — Pedido 24 (assédio moral)
  { paraId: '03CFA3FE', tag: 'assedio_ativo',               label: 'z'   },
  // aa — Pedido 25 (assédio sexual)
  { paraId: '6BE7898C', tag: 'assedio_sexual_ativo',        label: 'aa'  },
  // bb — Pedido 27 (insalubridade grau máximo)
  { paraId: '6225D125', tag: 'insalubridade_ativa',         label: 'bb'  },
  // cc — Pedido 28 (pausas térmicas)
  { paraId: '19ECD5DA', tag: 'pausas_termicas_ativa',       label: 'cc'  },
  // dd — Pedido 29 e 30 (reversão justa causa)
  { paraId: '5690523B', tag: 'reversao_justa_causa_ativa',  label: 'dd'  },
  // ee, ff — Pedido 33 (pensão mensal)
  { paraId: '5F68F7F3', tag: 'pensao_mensal_ativa',         label: 'ee'  },
  { paraId: '7E8E9FA7', tag: 'pensao_mensal_ativa',         label: 'ff'  },
  // gg — Pedido 31 e 32 (acidente ou doença)
  { paraId: '640FE67C', tag: 'acidente_ou_doenca_ativa',    label: 'gg'  },
  // kk + sub-itens — Pedido 36 (gestante)
  { paraId: '22D7AD8C', tag: 'gestante_ativa',              label: 'kk'  },
  { paraId: '247B0364', tag: 'gestante_ativa',              label: 'kk.1'},
  { paraId: '471CAF2D', tag: 'gestante_ativa',              label: 'kk.2'},
  // nn — Pedido 42 (desvio de função)
  { paraId: '7667E3E0', tag: 'desvio_funcao_ativo',         label: 'nn'  },
  // pp — Pedido 44 (insalubridade limpeza banheiro)
  { paraId: '6FBCFB9E', tag: 'limpeza_banheiro_ativa',      label: 'pp'  },
  // qq — Pedido 45 (periculosidade)
  { paraId: '6D340484', tag: 'periculosidade_ativa',        label: 'qq'  },
  // tt — Pedido 27 (insalubridade calor)
  { paraId: '4A43C354', tag: 'insalubridade_ativa',         label: 'tt'  },
  // vv — Pedido 48 (INSS)
  { paraId: '55EB1F4A', tag: 'vinculo_ativo_inss',          label: 'vv'  },
  // ww — Pedido 49 (IR)
  { paraId: '2E7760AE', tag: 'vinculo_ativo_ir',            label: 'ww'  },
  // xx, yy, zz, aaa, bbb — sem condicional (sempre presentes), skip
];

for (const { paraId, tag, label } of toWrap) {
  xml = wrapParaId(xml, paraId, tag);
  console.log(`  [${label}] ${paraId} → {#${tag}}`);
}

zip.file('word/document.xml', xml);
const out = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
writeFileSync(TEMPLATE, out);
console.log('\nSalvo: template-at.docx');
