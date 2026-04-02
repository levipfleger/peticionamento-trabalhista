import { FormField } from '../FormField';

interface BlocoProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dados: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (campo: string, valor: any) => void;
}

export const BlocoRescisao = ({ dados, onChange }: BlocoProps) => {
  const handleChange = (campo: string, valor: any) => {
    onChange(campo, valor);
    if (campo === 'verbas_pagas' && valor !== 'Parcialmente') onChange('verbas_pagas_valor', '');
    if (campo === 'verbas_prazo' && valor !== false) onChange('verbas_prazo_data', '');
    if (campo === 'valores_corretos' && valor !== false) onChange('valores_incorretos_obs', '');
    if (campo === 'guias_entregues' && valor !== 'Não') onChange('guias_data_entrega', '');
  };
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <FormField
          label="Motivo da rescisão do contrato"
          value={dados.motivo_rescisao}
          onChange={(v) => onChange('motivo_rescisao', v)}
        />
      </div>

      {/* Pagamento das verbas rescisórias */}
      <div style={{ marginBottom: 15 }}>
        <FormField
          label="Houve pagamento das verbas rescisórias?"
          type="select_radio"
          options={['Sim', 'Não', 'Parcialmente']}
          value={dados.verbas_pagas}
          onChange={(v) => handleChange('verbas_pagas', v)}
        />
        {dados.verbas_pagas === 'Parcialmente' && (
          <div style={{ marginTop: 10, paddingLeft: 15, borderLeft: '3px solid #faad14' }}>
            <FormField
              label="Valor que foi pago"
              type="money"
              value={dados.verbas_pagas_valor}
              onChange={(v) => onChange('verbas_pagas_valor', v)}
            />
          </div>
        )}
      </div>

      {/* Verbas no prazo */}
      <div style={{ marginBottom: 15 }}>
        <FormField
          label="Verbas rescisórias pagas dentro do prazo?"
          type="boolean_sim_nao"
          value={dados.verbas_prazo}
          onChange={(v) => handleChange('verbas_prazo', v)}
        />
        {dados.verbas_prazo === false && (
          <div style={{ marginTop: 10, paddingLeft: 15, borderLeft: '3px solid #ff4d4f' }}>
            <FormField
              label="Data em que o pagamento foi efetuado"
              type="date"
              value={dados.verbas_prazo_data}
              onChange={(v) => onChange('verbas_prazo_data', v)}
            />
          </div>
        )}
      </div>

      {/* Valores corretos */}
      <div style={{ marginBottom: 15 }}>
        <FormField
          label="Os valores pagos estão corretos?"
          type="boolean_sim_nao"
          value={dados.valores_corretos}
          onChange={(v) => handleChange('valores_corretos', v)}
        />
        {dados.valores_corretos === false && (
          <div style={{ marginTop: 10, paddingLeft: 15, borderLeft: '3px solid #ff4d4f' }}>
            <FormField
              label="O que está errado? (valor ou verba faltante)"
              type="textarea"
              value={dados.valores_incorretos_obs}
              onChange={(v) => onChange('valores_incorretos_obs', v)}
            />
          </div>
        )}
      </div>

      {/* Guias FGTS e Seguro-Desemprego */}
      <div style={{ marginBottom: 15 }}>
        <FormField
          label="Guias de FGTS e Seguro-Desemprego entregues no prazo correto?"
          type="select_radio"
          options={['Sim', 'Não', 'Não recebeu']}
          value={dados.guias_entregues}
          onChange={(v) => handleChange('guias_entregues', v)}
        />
        {dados.guias_entregues === 'Não' && (
          <div style={{ marginTop: 10, paddingLeft: 15, borderLeft: '3px solid #ff4d4f' }}>
            <FormField
              label="Data em que as guias foram entregues"
              type="date"
              value={dados.guias_data_entrega}
              onChange={(v) => onChange('guias_data_entrega', v)}
            />
          </div>
        )}
      </div>

      {/* Aviso-prévio */}
      <div style={{ marginTop: 20, padding: 15, backgroundColor: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f' }}>
        <FormField
          label="Aviso-Prévio"
          type="select_radio"
          options={['Indenizado', 'Trabalhado']}
          value={dados.aviso_previo_modo}
          onChange={(v) => onChange('aviso_previo_modo', v)}
        />
        <FormField
          label="Situação do Aviso Prévio"
          type="select_radio"
          options={['Não pago', 'Não trabalhado']}
          value={dados.aviso_previo_situacao}
          onChange={(v) => onChange('aviso_previo_situacao', v)}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 10 }}>
          <FormField
            label="Data do aviso-prévio"
            type="date"
            value={dados.aviso_previo_data}
            onChange={(v) => onChange('aviso_previo_data', v)}
          />
          <FormField
            label="Último dia trabalhado"
            type="date"
            value={dados.ultimo_dia_trabalhado}
            onChange={(v) => onChange('ultimo_dia_trabalhado', v)}
          />
        </div>
      </div>
    </div>
  );
};
