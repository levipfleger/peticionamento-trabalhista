import { FormField } from '../FormField';

interface BlocoProps {
  dados: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  onChange: (campo: string, valor: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export const BlocoFerias = ({ dados, onChange }: BlocoProps) => {
  const handleChange = (campo: string, valor: any) => {
    onChange(campo, valor);
    if (campo === 'ficou_sem_decimo' && valor !== true) onChange('anos_sem_decimo', '');
  };
  return (
    <div>
      <div style={{ backgroundColor: '#fffbe6', padding: 20, borderRadius: 8, border: '1px solid #ffe58f', marginBottom: 25 }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#d48806', fontSize: '1.1rem' }}>Férias</h4>

        <FormField
          label="Recebia férias regularmente?"
          type="select_radio"
          options={['Sim', 'Não', 'Parcialmente']}
          value={dados.ferias_regularidade}
          onChange={(v) => onChange('ferias_regularidade', v)}
        />

        <div style={{ marginTop: 15 }}>
          <FormField
            label="As férias eram:"
            type="select_radio"
            options={['Gozadas corretamente', 'Pagas, mas não gozadas', 'Nem pagas, nem gozadas']}
            value={dados.ferias_status}
            onChange={(v) => onChange('ferias_status', v)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 15 }}>
          <FormField
            label="Havia exigência de trabalho durante as férias?"
            type="boolean_sim_nao"
            value={dados.trabalho_nas_ferias}
            onChange={(v) => onChange('trabalho_nas_ferias', v)}
          />
          <FormField
            label="Recebia o adicional de 1/3 constitucional?"
            type="boolean_sim_nao"
            value={dados.ferias_um_terco}
            onChange={(v) => onChange('ferias_um_terco', v)}
          />
        </div>

        <div style={{ marginTop: 15 }}>
          <FormField
            label="O pagamento das férias ocorria:"
            type="select_radio"
            options={['Até 2 dias antes do início', 'Fora do prazo legal']}
            value={dados.ferias_prazo_pagamento}
            onChange={(v) => onChange('ferias_prazo_pagamento', v)}
          />
        </div>
      </div>

      <div style={{ backgroundColor: '#f6ffed', padding: 20, borderRadius: 8, border: '1px solid #b7eb8f' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#389e0d', fontSize: '1.1rem' }}>13º Salário</h4>

        <FormField
          label="Recebia 13º Salário?"
          type="select_radio"
          options={['Sim', 'Não', 'Parcialmente']}
          value={dados.decimo_terceiro_status}
          onChange={(v) => onChange('decimo_terceiro_status', v)}
        />

        <div style={{ marginTop: 15 }}>
          <FormField
            label="O 13º era pago:"
            type="select_radio"
            options={['Integralmente', 'Apenas a 1ª parcela', 'Fora do prazo']}
            value={dados.decimo_terceiro_pagamento}
            onChange={(v) => onChange('decimo_terceiro_pagamento', v)}
          />
        </div>

        <div style={{ marginTop: 15, paddingTop: 15, borderTop: '1px dashed #b7eb8f' }}>
          <FormField
            label="Algum ano ficou sem pagamento de 13º?"
            type="boolean_sim_nao"
            value={dados.ficou_sem_decimo}
            onChange={(v) => handleChange('ficou_sem_decimo', v)}
          />

          {dados.ficou_sem_decimo === true && (
            <div style={{ marginTop: 15, paddingLeft: 15, borderLeft: '3px solid #52c41a' }}>
              <FormField
                label="Quais anos?"
                placeholder="Ex: 2021, 2022 e 2023..."
                value={dados.anos_sem_decimo}
                onChange={(v) => onChange('anos_sem_decimo', v)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
