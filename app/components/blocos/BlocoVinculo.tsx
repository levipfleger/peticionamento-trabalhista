import { FormField } from '../FormField';

interface BlocoProps {
  dados: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  onChange: (campo: string, valor: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export const BlocoVinculo = ({ dados, onChange }: BlocoProps) => {
  const handleChange = (campo: string, valor: any) => {
    onChange(campo, valor);
    if (campo === 'classificacao_empresa') {
      if (valor !== 'Autônomo' && valor !== 'Pejotização') {
        onChange('contrato_particular', null);
        onChange('contrato_assinado', null);
      }
      if (valor !== 'Outras modalidades') onChange('outras_modalidades_descricao', '');
    }
    if (campo === 'contrato_particular' && valor !== true) onChange('contrato_assinado', null);
    if (campo === 'subordinado' && valor !== true) onChange('ordens_de_quem', '');
  };

  const classificacao = dados.classificacao_empresa;
  const exibeContrato = classificacao === 'Autônomo' || classificacao === 'Pejotização';

  return (
    <div>
      <div style={{ backgroundColor: '#f0f5ff', padding: 20, borderRadius: 8, border: '1px solid #adc6ff', marginBottom: 25 }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#1d39c4', fontSize: '1.1rem' }}>A Relação de Trabalho</h4>

        <FormField
          label="Como a empresa classificava a relação de trabalho?"
          type="select_radio"
          options={['Autônomo', 'Pejotização', '"Contrato Verbal"', 'Outras modalidades']}
          value={classificacao}
          onChange={(v) => handleChange('classificacao_empresa', v)}
        />

        {exibeContrato && (
          <div style={{ marginTop: 15, paddingLeft: 15, borderLeft: '3px solid #722ed1' }}>
            <FormField
              label="Havia instrumento particular de contrato formalizando a relação?"
              type="boolean_sim_nao"
              value={dados.contrato_particular}
              onChange={(v) => handleChange('contrato_particular', v)}
            />
            {dados.contrato_particular === true && (
              <div style={{ marginTop: 10, paddingLeft: 15, borderLeft: '3px solid #722ed1' }}>
                <FormField
                  label="O contrato foi assinado?"
                  type="boolean_sim_nao"
                  value={dados.contrato_assinado}
                  onChange={(v) => onChange('contrato_assinado', v)}
                />
              </div>
            )}
          </div>
        )}

        {classificacao === 'Outras modalidades' && (
          <div style={{ marginTop: 15, paddingLeft: 15, borderLeft: '3px solid #faad14' }}>
            <FormField
              label="Descreva a modalidade"
              type="textarea"
              value={dados.outras_modalidades_descricao}
              onChange={(v) => onChange('outras_modalidades_descricao', v)}
            />
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <FormField
            label="Forma de execução do serviço:"
            type="select_radio"
            options={['Presencial', 'A distância', 'Interno', 'Externo']}
            value={dados.forma_execucao}
            onChange={(v) => onChange('forma_execucao', v)}
          />
        </div>
      </div>

      <div style={{ backgroundColor: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e8e8e8' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#444', fontSize: '1.1rem' }}>Requisitos do Vínculo Empregatício</h4>

        <div style={{ marginBottom: 15, paddingBottom: 15, borderBottom: '1px dashed #f0f0f0' }}>
          <FormField
            label="Tinha pessoalidade (não podia mandar substituto)?"
            type="boolean_sim_nao"
            value={dados.pessoalidade}
            onChange={(v) => onChange('pessoalidade', v)}
          />
        </div>

        <div style={{ marginBottom: 15, paddingBottom: 15, borderBottom: '1px dashed #f0f0f0' }}>
          <FormField
            label="Era subordinado (recebia ordens)?"
            type="boolean_sim_nao"
            value={dados.subordinado}
            onChange={(v) => handleChange('subordinado', v)}
          />
          {dados.subordinado === true && (
            <div style={{ marginTop: 15, paddingLeft: 15, borderLeft: '3px solid #1890ff' }}>
              <FormField
                label="Recebia ordens de quem?"
                placeholder="Ex: Do gerente da loja, do dono da empresa..."
                value={dados.ordens_de_quem}
                onChange={(v) => onChange('ordens_de_quem', v)}
              />
            </div>
          )}
        </div>

        <div style={{ marginBottom: 15, paddingBottom: 15, borderBottom: '1px dashed #f0f0f0' }}>
          <FormField
            label="Havia habitualidade (trabalho contínuo)?"
            type="boolean_sim_nao"
            value={dados.habitualidade}
            onChange={(v) => onChange('habitualidade', v)}
          />
        </div>

        <div style={{ marginBottom: 15, paddingBottom: 15, borderBottom: '1px dashed #f0f0f0' }}>
          <FormField
            label="Onerosidade (pagamento fixo)?"
            type="boolean_sim_nao"
            value={dados.onerosidade}
            onChange={(v) => onChange('onerosidade', v)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <FormField
            label="Prestava serviço pra outras empresas?"
            type="boolean_sim_nao"
            value={dados.prestava_outras}
            onChange={(v) => onChange('prestava_outras', v)}
          />
          <FormField
            label="Podia prestar serviço pra outras empresas?"
            type="boolean_sim_nao"
            value={dados.podia_prestar_outras}
            onChange={(v) => onChange('podia_prestar_outras', v)}
          />
        </div>

        <div style={{ marginTop: 20 }}>
          <FormField
            label="Horários de trabalho: eram flexíveis ou precisava cumprir jornada?"
            placeholder="Ex: Precisava cumprir das 08h às 18h, ou fazia o próprio horário..."
            value={dados.horarios_flexibilidade}
            onChange={(v) => onChange('horarios_flexibilidade', v)}
          />
        </div>
      </div>
    </div>
  );
};
