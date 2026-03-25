import { FormField } from '../FormField';

interface BlocoProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dados: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (campo: string, valor: any) => void;
}

export const BlocoSolidaria = ({ dados, onChange }: BlocoProps) => {
  const handleChange = (campo: string, valor: any) => {
    onChange(campo, valor);
    const fields = ['terceirizacao', 'grupo_economico', 'responsabilidade_construcao', 'empresa_interposta'];
    if (fields.includes(campo)) {
      const updated = { ...dados, [campo]: valor };
      const anyTrue = fields.some(f => updated[f] === true);
      if (!anyTrue) onChange('descricao_empresas_envolvidas', '');
    }
  };
  return (
    <div>
      <div style={{ backgroundColor: '#f0f5ff', padding: 20, borderRadius: 8, border: '1px solid #adc6ff', marginBottom: 25 }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1d39c4', fontSize: '1.1rem' }}>Terceirização e Grupo Econômico</h4>
        <p style={{ fontSize: '0.85rem', color: '#595959', marginBottom: 20 }}>
          Indique se o trabalhador prestava serviços para outras empresas além daquela que assinou a carteira (ex: terceirização, grupo econômico, donos em comum).
        </p>
        <FormField label="Terceirização?" type="boolean_sim_nao" value={dados.terceirizacao} onChange={(v) => handleChange('terceirizacao', v)} />
        <FormField label="Grupo Econômico?" type="boolean_sim_nao" value={dados.grupo_economico} onChange={(v) => handleChange('grupo_economico', v)} />
        <FormField label="Responsabilidade na construção civil?" type="boolean_sim_nao" value={dados.responsabilidade_construcao} onChange={(v) => handleChange('responsabilidade_construcao', v)} />
        <FormField label="Empresa interposta?" type="boolean_sim_nao" value={dados.empresa_interposta} onChange={(v) => handleChange('empresa_interposta', v)} />
        {(dados.terceirizacao === true || dados.grupo_economico === true || dados.responsabilidade_construcao === true || dados.empresa_interposta === true) && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px dashed #adc6ff' }}>
            <FormField
              label="Caso positivo, descreva abaixo todas as empresas envolvidas no contrato de trabalho e detalhe a relação que leva ao reconhecimento da responsabilidade solidária/subsidiária:"
              type="textarea"
              value={dados.descricao_empresas_envolvidas}
              onChange={(v) => onChange('descricao_empresas_envolvidas', v)}
              placeholder="Ex: O reclamante foi contratado pela Empresa A (terceirizada), mas prestava serviços exclusivamente dentro das dependências da Empresa B (tomadora)..."
            />
          </div>
        )}
      </div>
    </div>
  );
};
