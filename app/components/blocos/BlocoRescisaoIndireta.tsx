import { FormField } from '../FormField';

interface BlocoProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dados: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (campo: string, valor: any) => void;
}

const SITUACOES_RESCISAO_INDIRETA = [
  'Atraso frequente de salários',
  'Falta de pagamento de FGTS',
  'Não pagamento de férias',
  'Não pagamento de 13º salário',
  'Excesso de jornada habitual sem pagamento',
  'Assédio moral',
  'Ambiente de trabalho insalubre/perigoso sem adicional',
  'Desvio ou acúmulo de função',
  'Outras faltas graves do empregador',
];

export const BlocoRescisaoIndireta = ({ dados, onChange }: BlocoProps) => {
  const toggleSituacao = (situacao: string) => {
    const atuais: string[] = Array.isArray(dados.situacoes_ocorridas) ? dados.situacoes_ocorridas : [];
    if (atuais.includes(situacao)) {
      onChange('situacoes_ocorridas', atuais.filter(s => s !== situacao));
      if (situacao === 'Outras faltas graves do empregador') {
        onChange('outras_faltas_descricao', '');
      }
    } else {
      onChange('situacoes_ocorridas', [...atuais, situacao]);
    }
  };
  const situacoesSelecionadas: string[] = Array.isArray(dados.situacoes_ocorridas) ? dados.situacoes_ocorridas : [];

  return (
    <div>
      <div style={{ backgroundColor: '#f0f5ff', padding: 20, borderRadius: 8, border: '1px solid #adc6ff', marginBottom: 25 }}>
        <FormField
          label="Ainda está trabalhando na empresa?"
          type="boolean_sim_nao"
          value={dados.ainda_trabalhando}
          onChange={(v) => onChange('ainda_trabalhando', v)}
        />
      </div>

      <div style={{ backgroundColor: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e8e8e8', marginBottom: 25 }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#444', fontSize: '1.1rem' }}>Faltas Graves do Empregador</h4>
        <label style={{ fontSize: '0.95rem', fontWeight: 600, color: '#444', marginBottom: 10, display: 'block' }}>
          Marque as situações que ocorreram:
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          {SITUACOES_RESCISAO_INDIRETA.map(situacao => (
            <label key={situacao} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', backgroundColor: situacoesSelecionadas.includes(situacao) ? '#fff1f0' : '#fff', borderColor: situacoesSelecionadas.includes(situacao) ? '#ff4d4f' : '#ddd' }}>
              <input type="checkbox" checked={situacoesSelecionadas.includes(situacao)} onChange={() => toggleSituacao(situacao)} />
              {situacao}
            </label>
          ))}
        </div>
        {situacoesSelecionadas.includes('Outras faltas graves do empregador') && (
          <div style={{ marginTop: 15, paddingLeft: 15, borderLeft: '3px solid #ff4d4f' }}>
            <FormField
              label="Descreva as outras faltas graves:"
              value={dados.outras_faltas_descricao}
              onChange={(v) => onChange('outras_faltas_descricao', v)}
              placeholder="Ex: Agressão física, rigor excessivo, exigência de serviços ilícitos..."
            />
          </div>
        )}
      </div>

      <div style={{ backgroundColor: '#fffbe6', padding: 20, borderRadius: 8, border: '1px solid #ffe58f' }}>
        <FormField
          label="Descreva em detalhes as irregularidades:"
          type="textarea"
          value={dados.detalhes_irregularidades}
          onChange={(v) => onChange('detalhes_irregularidades', v)}
          placeholder="Ex: O FGTS não é depositado desde janeiro de 2022, e o salário do mês de março atrasou 15 dias..."
        />
      </div>
    </div>
  );
};
