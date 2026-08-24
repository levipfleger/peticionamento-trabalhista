import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

function dataHoje(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function parseFone(tel: string): { ddd: string; num: string } {
  const m = tel.match(/\((\d{2})\)\s*(.+)/);
  if (m) return { ddd: m[1], num: m[2] };
  return { ddd: '', num: tel };
}


function listaEmpresas(empresas: Record<string, unknown>[]): string {
  const s = (v: unknown) => (typeof v === 'string' ? v : '');
  const nomes = empresas.map(e => s(e.nome)).filter(Boolean);
  if (nomes.length === 0) return '';
  if (nomes.length === 1) return nomes[0];
  return nomes.slice(0, -1).join(', ') + ' e ' + nomes[nomes.length - 1];
}

function gerarDocCliente(templateBuf: Buffer, c: Record<string, unknown>, empresas: Record<string, unknown>[], i: Record<string, unknown>, notas: string): Buffer {
  const s = (v: unknown) => (typeof v === 'string' ? v : '');
  const e = empresas[0] || {};
  const telCel = parseFone(s(c.tel_celular));
  const telCom = parseFone(s(c.tel_residencial));
  const telRec = parseFone(s(c.tel_comercial));

  const zip = new PizZip(templateBuf);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

  doc.render({
    nome:           s(c.nome).toUpperCase(),
    cpf:            s(c.cpf),
    nome_mae:       s(c.nome_mae),
    estado_civil:   s(c.estado_civil),
    nascimento:     s(c.nascimento),
    nacionalidade:  s(c.nacionalidade),
    profissao:      s(c.profissao),
    endereco:       s(c.endereco),
    bairro:         s(c.bairro),
    cidade:         s(c.cidade),
    cep:            s(c.cep),
    tel_cel_ddd:    telCel.ddd,
    tel_cel_num:    telCel.num,
    tel_com_ddd:    telCom.ddd,
    tel_com_num:    telCom.num,
    tel_rec_ddd:    telRec.ddd,
    tel_rec_num:    telRec.num,
    tel_res_ddd:    '',
    tel_res_num:    '',
    email:          s(c.email),
    empresa_nome:      s(e.nome),
    empresa_endereco:  s(e.endereco),
    empresa_bairro:    s(e.bairro),
    empresa_cidade:    s(e.cidade),
    empresa_cep:       s(e.cep),
    empresas_lista:    listaEmpresas(empresas),
    honorarios:        s(i.honorarios),
    forma_pagamento:   s(i.forma_pagamento),
    responsavel:       s(i.responsavel),
    data_hoje:         dataHoje(),
    anotacoes:         notas,
    tem_anotacoes:     notas.length > 0,
  });

  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' }) as Buffer;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dados = body.dados;
    if (!dados) return NextResponse.json({ error: 'Parâmetro dados obrigatório' }, { status: 400 });

    const clientes: Record<string, unknown>[] = Array.isArray(dados.clientes) && dados.clientes.length > 0
      ? dados.clientes
      : [{}];
    const empresas: Record<string, unknown>[] = Array.isArray(dados.empresas) && dados.empresas.length > 0
      ? dados.empresas
      : [{}];
    const i = dados.interno || {};
    const notas = String(dados.analise_juridica?.anotacoes?.anotacoes_livres ?? '').trim();

    const templatePath = path.join(process.cwd(), 'public', 'template-documentos', 'template-carmes.docx');
    const templateBuf = await fs.promises.readFile(templatePath);

    const nomeBaseRaw: string = typeof dados.filename === 'string' ? dados.filename : 'documento';
    const nomeBase = nomeBaseRaw.replace('.json', '');

    // Um único cliente → devolve o .docx diretamente
    if (clientes.length === 1) {
      const buf = gerarDocCliente(templateBuf, clientes[0], empresas, i, notas);
      const s = (v: unknown) => (typeof v === 'string' ? v : '');
      const nome = s(clientes[0].nome) || 'Cliente';
      const nomeArquivo = `${nomeBase} - ${nome} - Documentos.docx`;
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(nomeArquivo)}`,
        },
      });
    }

    // Múltiplos clientes → ZIP com um .docx por cliente
    const archive = new PizZip();
    const s = (v: unknown) => (typeof v === 'string' ? v : '');

    for (let idx = 0; idx < clientes.length; idx++) {
      const c = clientes[idx];
      const buf = gerarDocCliente(templateBuf, c, empresas, i, notas);
      const nome = s(c.nome) || `Cliente ${idx + 1}`;
      archive.file(`${nomeBase} - ${nome} - Documentos.docx`, buf);
    }

    const zipBuf = archive.generate({ type: 'nodebuffer', compression: 'DEFLATE' }) as Buffer;
    const nomeZip = `${nomeBase} - Documentos.zip`;

    return new NextResponse(new Uint8Array(zipBuf), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(nomeZip)}`,
      },
    });
  } catch (err) {
    console.error('[gerar-documento]', err);
    return NextResponse.json({ error: 'Erro ao gerar documento' }, { status: 500 });
  }
}
