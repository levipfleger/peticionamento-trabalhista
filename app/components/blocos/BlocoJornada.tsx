import { FormField } from '../FormField';

interface BlocoProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dados: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (campo: string, valor: any) => void;
}

export const BlocoJornada = ({ dados, onChange }: BlocoProps) => {
  const handleChange = (campo: string, valor: any) => {
    onChange(campo, valor);
    if (campo === 'controle_ponto' && valor !== 'Existia') onChange('ponto_fidedigno', '');
    if (campo === 'horas_extras' && valor !== true) onChange('situacao_pagamento_horas', null);
  };
  return (
    <div>
      <div style={{ backgroundColor: '#f0f7ff', padding: 15, borderRadius: 8, border: '1px solid #d6e4ff', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
          <FormField
            label="Horas Extras"
            type="boolean_sim_nao"
            value={dados.horas_extras}
            onChange={(v) => handleChange('horas_extras', v)}
          />
          <FormField
            label="Intervalo Intrajornada era respeitado?"
            type="boolean_sim_nao"
            value={dados.intervalo_intra_respeitado}
            onChange={(v) => onChange('intervalo_intra_respeitado', v)}
          />
          <FormField
            label="Jornada Noturna?"
            type="boolean_sim_nao"
            value={dados.jornada_noturna}
            onChange={(v) => onChange('jornada_noturna', v)}
          />
          <FormField
            label="Intervalo Entrejornada era respeitado?"
            type="boolean_sim_nao"
            value={dados.intervalo_entre_respeitado}
            onChange={(v) => onChange('intervalo_entre_respeitado', v)}
          />
        </div>
      </div>

      {dados.horas_extras === true && (
        <div style={{ marginBottom: 20 }}>
          <FormField
            label="Pagamento de horas extras"
            type="select_radio"
            options={['Eram pagas', 'Não eram pagas', 'Eram pagas a menor']}
            value={dados.situacao_pagamento_horas}
            onChange={(v) => onChange('situacao_pagamento_horas', v)}
          />
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <FormField
          label="Repouso semanal respeitado?"
          type="boolean_sim_nao"
          value={dados.repouso_semanal_respeitado}
          onChange={(v) => onChange('repouso_semanal_respeitado', v)}
        />
      </div>

      <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '20px 0' }} />

      <div style={{ backgroundColor: '#f0f7ff', padding: 15, borderRadius: 8, border: '1px solid #d6e4ff' }}>
        <FormField
          label="Controle de ponto"
          type="select_radio"
          options={['Existia', 'Não existia']}
          value={dados.controle_ponto}
          onChange={(v) => handleChange('controle_ponto', v)}
        />

        {dados.controle_ponto === 'Existia' && (
          <div style={{ marginTop: 15, paddingLeft: 15, borderLeft: '3px solid #1890ff' }}>
            <FormField
              label="A jornada anotada no ponto correspondia à verdade?"
              type="textarea"
              value={dados.ponto_fidedigno}
              onChange={(v) => onChange('ponto_fidedigno', v)}
            />
          </div>
        )}
      </div>

      <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '20px 0' }} />

      <FormField
        label="Jornada e Intervalos"
        type="textarea"
        placeholder="Anote os horários efetivos de entrada e saída, variações de jornada, intervalos intrajornada, entrejornada e demais intervalos legais e convencionais."
        value={dados.jornada_e_intervalos}
        onChange={(v) => onChange('jornada_e_intervalos', v)}
      />
    </div>
  );
};
