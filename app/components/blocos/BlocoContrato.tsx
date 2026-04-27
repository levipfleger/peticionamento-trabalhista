import { FormField } from '../FormField';

interface BlocoProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dados: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (campo: string, valor: any) => void;
}

export const BlocoContrato = ({ dados, onChange }: BlocoProps) => {
  const handleChange = (campo: string, valor: any) => {
    onChange(campo, valor);
    if (campo === 'tem_salario_por_fora' && valor !== true) {
      onChange('valor_por_fora', '');
      onChange('modo_pagamento_por_fora', '');
    }
  };
  return (
    <div>
      <FormField label="Carteira assinada?" type="boolean_sim_nao" value={dados.ctps_assinada} onChange={(v) => onChange('ctps_assinada', v)} />

      <FormField label="Incluir Justiça Gratuita?" type="boolean_sim_nao" value={dados.justica_gratuita} onChange={(v) => onChange('justica_gratuita', v)} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <FormField label="Data de Admissão (Real)" type="date" value={dados.admissao_real} onChange={(v) => onChange('admissao_real', v)} />
        <FormField label="Data de Saída (Real)" type="date" value={dados.demissao_real} onChange={(v) => onChange('demissao_real', v)} />
      </div>

      <FormField label="Local de Trabalho (Circunscrição)" value={dados.local_trabalho} onChange={(v) => onChange('local_trabalho', typeof v === 'string' ? v.toUpperCase() : v)} />

      <FormField label="Região do Tribunal" type="number" value={dados.regiao_tribunal} onChange={(v) => onChange('regiao_tribunal', v)} />

      <div style={{ border: '1px solid #eee', padding: 15, borderRadius: 8, marginBottom: 15 }}>
        <FormField label="Função Exercida (Dia a dia)" value={dados.funcao_exercida} onChange={(v) => onChange('funcao_exercida', v)} />
        <FormField label="Função na Carteira (CTPS)" value={dados.funcao_registrada} onChange={(v) => onChange('funcao_registrada', v)} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 10 }}>
          <FormField
            label="Haverá pedido de equiparação salarial?"
            type="boolean_sim_nao"
            value={dados.equiparacao_salarial}
            onChange={(v) => onChange('equiparacao_salarial', v)}
          />
          <FormField
            label="Haverá pedido de desvio de função?"
            type="boolean_sim_nao"
            value={dados.desvio_funcao}
            onChange={(v) => onChange('desvio_funcao', v)}
          />
        </div>
        <FormField label="Obs. sobre a função (Desvio/Acúmulo)" type="textarea" value={dados.obs_funcao} onChange={(v) => onChange('obs_funcao', v)} />
      </div>

      <FormField label="Último Salário (R$)" type="money" value={dados.ultimo_salario} onChange={(v) => onChange('ultimo_salario', v)} />

      <FormField
        label="Situação do FGTS"
        type="select_radio"
        options={['Regular', 'Irregular', 'Não sabe']}
        value={dados.fgts_situacao}
        onChange={(v) => onChange('fgts_situacao', v)}
      />

      <FormField label="Exercia função com recebimento de valores (caixa etc)?" type="boolean_sim_nao" value={dados.exercia_funcao_caixa} onChange={(v) => onChange('exercia_funcao_caixa', v)} />

      <div style={{ backgroundColor: '#fffbe6', padding: 15, borderRadius: 8, border: '1px solid #ffe58f', marginTop: 10 }}>
        <FormField label="Recebia Salário 'Por Fora'?" type="boolean_sim_nao" value={dados.tem_salario_por_fora} onChange={(v) => handleChange('tem_salario_por_fora', v)} />

        {dados.tem_salario_por_fora === true && (
          <div style={{ marginTop: 15, paddingLeft: 15, borderLeft: '3px solid #faad14' }}>
            <FormField label="Qual valor pago por fora?" type="money" value={dados.valor_por_fora} onChange={(v) => onChange('valor_por_fora', v)} />
            <FormField label="Como era feito esse pagamento?" placeholder="Ex: Pix na conta da esposa, envelope..." value={dados.modo_pagamento_por_fora} onChange={(v) => onChange('modo_pagamento_por_fora', v)} />
          </div>
        )}
      </div>
    </div>
  );
};
