import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(process.cwd(), '..', 'dados-carmes');

function caminhoSeguro(filename: string): string | null {
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) return null;
  const resolved = path.resolve(dataDir, filename);
  if (!resolved.startsWith(dataDir + path.sep) && resolved !== dataDir) return null;
  return resolved;
}

function dataHoje(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('file');
    if (!filename) return NextResponse.json({ error: 'Parâmetro file obrigatório' }, { status: 400 });

    const filePath = caminhoSeguro(filename);
    if (!filePath) return NextResponse.json({ error: 'Nome de arquivo inválido' }, { status: 400 });

    const raw = await fs.promises.readFile(filePath, 'utf-8');
    const dados = JSON.parse(raw);

    const c = (dados.clientes?.[0]) || {};
    const e = (dados.empresas?.[0]) || {};
    const i = dados.interno || {};
    const contrato = (dados.analise_juridica?.contrato) || {};
    const solidaria = (dados.analise_juridica?.solidaria) || {};
    const vinculo = (dados.analise_juridica?.vinculo) || {};
    const ferias = (dados.analise_juridica?.ferias) || {};
    const jornada = (dados.analise_juridica?.jornada) || {};
    const rescisaoIndireta = (dados.analise_juridica?.rescisao_indireta) || {};
    const situacoes = (rescisaoIndireta.situacoes_ocorridas as string[]) || [];
    const faltasLista = situacoes.map((s2: string) => {
      const texto = s2 === 'Outras faltas graves do empregador' && rescisaoIndireta.outras_faltas_descricao
        ? String(rescisaoIndireta.outras_faltas_descricao)
        : s2;
      return texto.charAt(0).toLowerCase() + texto.slice(1);
    });
    const faltasGraves = faltasLista.length === 0 ? ''
      : faltasLista.length === 1 ? faltasLista[0]
      : faltasLista.slice(0, -1).join(', ') + ' e ' + faltasLista[faltasLista.length - 1];
    const rescisaoIndiretaAtiva =
      situacoes.length > 0 ||
      rescisaoIndireta.ainda_trabalhando != null ||
      !!rescisaoIndireta.detalhes_irregularidades;

    const vinculoAtivo = Object.values(vinculo).some(v =>
      v != null && v !== '' && !(Array.isArray(v) && v.length === 0)
    );

    const jornadaAtiva =
      jornada.horas_extras === true &&
      (jornada.situacao_pagamento_horas === 'Não eram pagas' ||
       jornada.situacao_pagamento_horas === 'Eram pagas a menor');

    const intraAtiva = jornada.intervalo_intra_respeitado === false;
    const interAtiva = jornada.intervalo_entre_respeitado === false;

    const decimoTerceiroAtivo =
      ferias.decimo_terceiro_status === 'Não' ||
      ferias.decimo_terceiro_status === 'Parcialmente' ||
      ferias.ficou_sem_decimo === true;

    const feriasFimFrase =
      ferias.ferias_status === 'Pagas, mas não gozadas'
        ? 'teve as férias gozadas, muito embora pagas'
        : ferias.ferias_status === 'Nem pagas, nem gozadas'
          ? 'teve as férias pagas tampouco gozadas'
          : 'gozou de férias';

    const s = (v: unknown) => (typeof v === 'string' ? v : '');

    const templatePath = path.join(process.cwd(), 'public', 'template-at', 'template-at.docx');
    const templateBuf = await fs.promises.readFile(templatePath);

    const zip = new PizZip(templateBuf);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    doc.render({
      nome:           s(c.nome),
      cpf:            s(c.cpf),
      estado_civil:   s(c.estado_civil),
      nascimento:     s(c.nascimento),
      nacionalidade:  s(c.nacionalidade),
      profissao:      s(c.profissao),
      endereco:       s(c.endereco),
      bairro:         s(c.bairro),
      cidade:         s(c.cidade),
      cep:            s(c.cep),
      empresa_nome:     s(e.nome),
      empresa_cnpj:     s(e.cnpj),
      empresa_endereco: s(e.endereco),
      empresa_bairro:   s(e.bairro),
      empresa_cidade:   s(e.cidade),
      empresa_estado:   s(e.estado),
      honorarios:     s(i.honorarios),
      justica_gratuita:   contrato.justica_gratuita === true,
      terceirizacao:               solidaria.terceirizacao === true,
      responsabilidade_construcao: solidaria.responsabilidade_construcao === true,
      grupo_economico:             solidaria.grupo_economico === true,
      empresa_interposta:          solidaria.empresa_interposta === true,
      funcao_registrada: s(contrato.funcao_registrada),
      ultimo_salario:    s(contrato.ultimo_salario),
      admissao_real:     s(contrato.admissao_real),
      demissao_real:     s(contrato.demissao_real),
      rescisao_indireta_ativa: rescisaoIndiretaAtiva,
      faltas_graves:           faltasGraves,
      vinculo_ativo:           vinculoAtivo,
      salario_extrafolha:      contrato.tem_salario_por_fora === true,
      ferias_ativo:            vinculoAtivo || ferias.ferias_status === 'Pagas, mas não gozadas' || ferias.ferias_status === 'Nem pagas, nem gozadas',
      ferias_fim_frase:        feriasFimFrase,
      decimo_terceiro_ativo:   decimoTerceiroAtivo,
      jornada_ativa:           jornadaAtiva,
      intra_ativa:             intraAtiva,
      jornada_inter_ativa:     interAtiva,
      local_trabalho:    s(contrato.local_trabalho),
      regiao_tribunal:   s(contrato.regiao_tribunal),
      data_hoje:      dataHoje(),
    });

    const buf: Buffer = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    const nomeArquivo = filename.replace('.json', '') + ' - AT.docx';

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(nomeArquivo)}`,
      },
    });
  } catch (err) {
    console.error('[gerar-at]', err);
    return NextResponse.json({ error: 'Erro ao gerar AT' }, { status: 500 });
  }
}
