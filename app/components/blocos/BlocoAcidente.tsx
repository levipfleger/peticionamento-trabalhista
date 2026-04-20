import { FormField } from '../FormField';

interface BlocoProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dados: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (campo: string, valor: any) => void;
}

const EXIGENCIAS_ATIVIDADE = [
  'Esforço repetitivo',
  'Peso excessivo',
  'Postura inadequada',
  'Exposição a agentes nocivos',
];

export const BlocoAcidente = ({ dados, onChange }: BlocoProps) => {
  const handleChange = (campo: string, valor: any) => {
    onChange(campo, valor);
    if (campo === 'sofreu_acidente' && valor !== true) {
      for (const f of ['data_acidente', 'local_acidente', 'como_ocorreu_acidente', 'momento_acidente', 'emitiu_cat', 'quem_emitiu_cat', 'afastado_acidente', 'tempo_afastamento_acidente']) onChange(f, '');
    }
    if (campo === 'emitiu_cat' && valor !== 'Sim') onChange('quem_emitiu_cat', '');
    if (campo === 'afastado_acidente' && valor !== true) onChange('tempo_afastamento_acidente', '');
    if (campo === 'sofreu_doenca' && valor !== 'Sim') {
      for (const f of ['doenca_diagnosticada', 'data_sintomas', 'diagnostico_relacionado', 'empresa_sabia_doenca']) onChange(f, '');
      onChange('atividade_exigia', []);
    }
    if (campo === 'afastamento_inss' && valor !== true) {
      for (const f of ['beneficio_inss', 'inss_inicio', 'inss_fim', 'retornou_trabalho', 'consequencia_retorno']) onChange(f, '');
    }
    if (campo === 'retornou_trabalho' && valor !== true) onChange('consequencia_retorno', '');
    if (campo === 'ficaram_sequelas' && valor !== true) {
      for (const f of ['consequencia_sequelas', 'tratamento_continuo']) onChange(f, '');
    }
  };

  const condAcidente = dados.sofreu_acidente === true;
  const condDoenca = dados.sofreu_doenca === 'Sim';
  const condAmbos = condAcidente || condDoenca;

  const toggleExigencia = (exigencia: string) => {
    const atuais: string[] = Array.isArray(dados.atividade_exigia) ? dados.atividade_exigia : [];
    if (atuais.includes(exigencia)) {
      onChange('atividade_exigia', atuais.filter(e => e !== exigencia));
    } else {
      onChange('atividade_exigia', [...atuais, exigencia]);
    }
  };
  const exigenciasSelecionadas: string[] = Array.isArray(dados.atividade_exigia) ? dados.atividade_exigia : [];

  return (
    <div>
      <div style={{ backgroundColor: '#f5f5f5', padding: 20, borderRadius: 8, border: '1px solid #ddd', marginBottom: 25 }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '1.1rem' }}>Fatos Geradores</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 15 }}>
          <FormField label="Sofreu acidente de trabalho durante o contrato?" type="boolean_sim_nao" value={dados.sofreu_acidente} onChange={(v) => handleChange('sofreu_acidente', v)} />
          <FormField label="Sofreu ou desenvolveu doença ocupacional relacionada ao trabalho?" type="select_radio" options={['Sim', 'Não']} value={dados.sofreu_doenca} onChange={(v) => handleChange('sofreu_doenca', v)} />
        </div>
      </div>

      {condAcidente && (
        <div style={{ backgroundColor: '#fff1f0', padding: 20, borderRadius: 8, border: '1px solid #ffa39e', marginBottom: 25 }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#cf1322', fontSize: '1.1rem' }}>Detalhes do Acidente</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <FormField label="Data do acidente" type="date" value={dados.data_acidente} onChange={(v) => handleChange('data_acidente', v)} />
            <FormField label="Local onde ocorreu" value={dados.local_acidente} onChange={(v) => handleChange('local_acidente', v)} />
          </div>
          <div style={{ marginTop: 15 }}>
            <FormField label="Como ocorreu o acidente?" type="textarea" value={dados.como_ocorreu_acidente} onChange={(v) => handleChange('como_ocorreu_acidente', v)} />
          </div>
          <div style={{ marginTop: 15 }}>
            <FormField label="O acidente ocorreu:" type="select_radio" options={['Durante a jornada', 'No trajeto (Casa <-> Trabalho)']} value={dados.momento_acidente} onChange={(v) => handleChange('momento_acidente', v)} />
          </div>
          <div style={{ marginTop: 20, padding: 15, backgroundColor: '#fff', borderRadius: 6, border: '1px solid #ffd8bf' }}>
            <FormField label="Houve emissão de CAT (Comunicação de Acidente de Trabalho)?" type="select_radio" options={['Sim', 'Não', 'Não sabe']} value={dados.emitiu_cat} onChange={(v) => handleChange('emitiu_cat', v)} />
            {dados.emitiu_cat === 'Sim' && (
              <div style={{ marginTop: 15, paddingLeft: 15, borderLeft: '3px solid #ff7a45' }}>
                <FormField label="Quem emitiu o CAT?" type="select_radio" options={['Empresa', 'Sindicato', 'Médico', 'O próprio trabalhador']} value={dados.quem_emitiu_cat} onChange={(v) => handleChange('quem_emitiu_cat', v)} />
              </div>
            )}
          </div>
          <div style={{ marginTop: 20 }}>
            <FormField label="Ficou afastado do trabalho?" type="boolean_sim_nao" value={dados.afastado_acidente} onChange={(v) => handleChange('afastado_acidente', v)} />
            {dados.afastado_acidente === true && (
              <div style={{ marginTop: 15 }}>
                <FormField label="Se sim, por quanto tempo?" placeholder="Ex: 15 dias, 2 meses..." value={dados.tempo_afastamento_acidente} onChange={(v) => handleChange('tempo_afastamento_acidente', v)} />
              </div>
            )}
          </div>
        </div>
      )}

      {condDoenca && (
        <div style={{ backgroundColor: '#f9f0ff', padding: 20, borderRadius: 8, border: '1px solid #d3adf7', marginBottom: 25 }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#531dab', fontSize: '1.1rem' }}>Detalhes da Doença Ocupacional</h4>
          <FormField label="Qual doença ou lesão diagnosticada?" value={dados.doenca_diagnosticada} onChange={(v) => handleChange('doenca_diagnosticada', v)} />
          <div style={{ marginTop: 15, marginBottom: 20 }}>
            <FormField label="Quando surgiram os primeiros sintomas?" type="date" value={dados.data_sintomas} onChange={(v) => handleChange('data_sintomas', v)} />
          </div>
          <div style={{ marginBottom: 25 }}>
            <label style={{ fontSize: '0.95rem', fontWeight: 600, color: '#444', marginBottom: 10, display: 'block' }}>A atividade exercida exigia:</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {EXIGENCIAS_ATIVIDADE.map(exigencia => (
                <label key={exigencia} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', backgroundColor: exigenciasSelecionadas.includes(exigencia) ? '#f0f5ff' : '#fff', borderColor: exigenciasSelecionadas.includes(exigencia) ? '#2f54eb' : '#ddd' }}>
                  <input type="checkbox" checked={exigenciasSelecionadas.includes(exigencia)} onChange={() => toggleExigencia(exigencia)} />
                  {exigencia}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <FormField label="Houve diagnóstico médico relacionado a doença ao trabalho?" type="boolean_sim_nao" value={dados.diagnostico_relacionado} onChange={(v) => handleChange('diagnostico_relacionado', v)} />
            <FormField label="A empresa tinha conhecimento da doença?" type="boolean_sim_nao" value={dados.empresa_sabia_doenca} onChange={(v) => handleChange('empresa_sabia_doenca', v)} />
          </div>
        </div>
      )}

      {condAmbos && (
        <div style={{ backgroundColor: '#e6f7ff', padding: 20, borderRadius: 8, border: '1px solid #91d5ff', marginBottom: 25 }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#0050b3', fontSize: '1.1rem' }}>Afastamento pelo INSS</h4>
          <FormField label="Houve afastamento pelo INSS?" type="boolean_sim_nao" value={dados.afastamento_inss} onChange={(v) => handleChange('afastamento_inss', v)} />
          {dados.afastamento_inss === true && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px dashed #91d5ff' }}>
              <FormField label="Qual benefício foi concedido?" type="select_radio" options={['Auxílio-doença comum (B31)', 'Auxílio-doença acidentário (B91)']} value={dados.beneficio_inss} onChange={(v) => handleChange('beneficio_inss', v)} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 15 }}>
                <FormField label="Período de afastamento (Início)" type="date" value={dados.inss_inicio} onChange={(v) => handleChange('inss_inicio', v)} />
                <FormField label="Período de afastamento (Fim)" type="date" value={dados.inss_fim} onChange={(v) => handleChange('inss_fim', v)} />
              </div>
              <div style={{ marginTop: 20 }}>
                <FormField label="Houve retorno ao trabalho?" type="boolean_sim_nao" value={dados.retornou_trabalho} onChange={(v) => handleChange('retornou_trabalho', v)} />
                {dados.retornou_trabalho === true && (
                  <div style={{ marginTop: 15, paddingLeft: 15, borderLeft: '3px solid #1890ff' }}>
                    <FormField label="Após o retorno, houve:" type="select_radio" options={['Redução de função', 'Mudança de setor', 'Demissão']} value={dados.consequencia_retorno} onChange={(v) => handleChange('consequencia_retorno', v)} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {condAmbos && (
        <div style={{ backgroundColor: '#fffbe6', padding: 20, borderRadius: 8, border: '1px solid #ffe58f' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#d48806', fontSize: '1.1rem' }}>Sequelas e Tratamento</h4>
          <FormField label="Ficaram sequelas?" type="boolean_sim_nao" value={dados.ficaram_sequelas} onChange={(v) => handleChange('ficaram_sequelas', v)} />
          {dados.ficaram_sequelas === true && (
            <div style={{ marginTop: 15, paddingLeft: 15, borderLeft: '3px solid #faad14' }}>
              <FormField label="As sequelas geraram:" type="select_radio" options={['Limitação funcional', 'Redução da capacidade de trabalho', 'Dor permanente']} value={dados.consequencia_sequelas} onChange={(v) => handleChange('consequencia_sequelas', v)} />
              <div style={{ marginTop: 15 }}>
                <FormField label="Necessita de tratamento continuo?" type="boolean_sim_nao" value={dados.tratamento_continuo} onChange={(v) => handleChange('tratamento_continuo', v)} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
