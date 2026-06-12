import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

function dataHoje(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dados = body.dados;
    if (!dados) return NextResponse.json({ error: 'Parâmetro dados obrigatório' }, { status: 400 });

    const c = (dados.clientes?.[0]) || {};
    const e = (dados.empresas?.[0]) || {};
    const i = dados.interno || {};
    const contrato = (dados.analise_juridica?.contrato) || {};
    const solidaria = (dados.analise_juridica?.solidaria) || {};
    const vinculo = (dados.analise_juridica?.vinculo) || {};
    const ferias = (dados.analise_juridica?.ferias) || {};
    const jornada = (dados.analise_juridica?.jornada) || {};
    const rescisao = (dados.analise_juridica?.rescisao) || {};
    const rescisaoIndireta = (dados.analise_juridica?.rescisao_indireta) || {};
    const assedio = (dados.analise_juridica?.assedio) || {};
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

    const equiparacao_salarial_ativa = contrato.equiparacao_salarial === true;
    const desvio_funcao_ativo        = contrato.desvio_funcao === true;

    const assedioTipos: string[] = Array.isArray(assedio.tipos_sofridos) ? assedio.tipos_sofridos : [];
    const assedio_ativo = assedioTipos.some(t => ['Assédio moral', 'Humilhações', 'Ameaças'].includes(t));
    const assedio_sexual_ativo = assedioTipos.includes('Assédio sexual');

    const insalubridade = (dados.analise_juridica?.insalubridade) || {};
    const agentesNocivos: string[] = Array.isArray(insalubridade.agentes_nocivos) ? insalubridade.agentes_nocivos : [];
    const insalubridade_ativa =
      agentesNocivos.length > 0 &&
      (insalubridade.adicional_recebido !== 'Insalubridade' || insalubridade.grau_correto === false);
    const pausas_termicas_ativa   = agentesNocivos.includes('Calor/Frio excessivo');
    const limpeza_banheiro_ativa  = agentesNocivos.includes('Limpeza de banheiro');
    const periculosidade_ativa    = insalubridade.adicional_recebido === 'Periculosidade';

    const reversao_justa_causa_ativa =
      rescisao.tipo_rescisao === 'Com Justa causa' && rescisao.reversao_justa_causa === true;

    const acidente = (dados.analise_juridica?.acidente) || {};
    const acidente_ativo          = acidente.sofreu_acidente === true;
    const doenca_ocupacional_ativa = acidente.sofreu_doenca === 'Sim';
    const pensao_mensal_ativa =
      acidente.afastamento_inss === true || acidente.ficaram_sequelas === true;

    const estabilidades = (dados.analise_juridica?.estabilidades) || {};
    const estabilidadesTipos: string[] = Array.isArray(estabilidades.indicios_estabilidade) ? estabilidades.indicios_estabilidade : [];
    const gestante_ativa = estabilidadesTipos.includes('Gestante');

    const vinculoAtivo = Object.entries(vinculo).some(([k, v]) =>
      k !== 'obs_geral_bloco' && k !== 'ignorar' &&
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

    const vinculo_ou_decimo_ativo  = vinculoAtivo || decimoTerceiroAtivo;
    const vinculo_ou_aviso_ativo   = vinculoAtivo || !!rescisao.aviso_previo_situacao;
    const acidente_ou_doenca_ativa = acidente_ativo || doenca_ocupacional_ativa;

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
      noturno_ativo:           jornada.jornada_noturna === true,
      repouso_ativo:           jornada.repouso_semanal_respeitado === false,
      caixa_ativo:             contrato.exercia_funcao_caixa === true,
      aviso_previo_ativo:      !!rescisao.aviso_previo_situacao,
      multa_477_ativa:         rescisao.verbas_prazo === false || rescisao.guias_entregues === 'Não',
      seguro_desemprego_ativo: vinculoAtivo || rescisao.guias_entregues === 'Não recebeu',
      vinculo_ativo_fgts:      vinculoAtivo,
      vinculo_ativo_inss:      vinculoAtivo,
      vinculo_ativo_ir:        vinculoAtivo,
      assedio_ativo:           assedio_ativo,
      assedio_sexual_ativo:    assedio_sexual_ativo,
      insalubridade_ativa:     insalubridade_ativa,
      pausas_termicas_ativa:        pausas_termicas_ativa,
      limpeza_banheiro_ativa:       limpeza_banheiro_ativa,
      periculosidade_ativa:         periculosidade_ativa,
      reversao_justa_causa_ativa:   reversao_justa_causa_ativa,
      pensao_mensal_ativa:          pensao_mensal_ativa,
      gestante_ativa:               gestante_ativa,
      equiparacao_salarial_ativa:   equiparacao_salarial_ativa,
      desvio_funcao_ativo:          desvio_funcao_ativo,
      acidente_ativo:               acidente_ativo,
      doenca_ocupacional_ativa:     doenca_ocupacional_ativa,
      vinculo_ou_decimo_ativo:      vinculo_ou_decimo_ativo,
      vinculo_ou_aviso_ativo:       vinculo_ou_aviso_ativo,
      acidente_ou_doenca_ativa:     acidente_ou_doenca_ativa,
      local_trabalho:    s(contrato.local_trabalho),
      regiao_tribunal:   s(contrato.regiao_tribunal),
      data_hoje:      dataHoje(),
    });

    const buf: Buffer = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    const nomeBaseRaw: string = typeof dados.filename === 'string' ? dados.filename : 'documento';
    const nomeArquivo = nomeBaseRaw.replace('.json', '') + ' - AT.docx';

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
