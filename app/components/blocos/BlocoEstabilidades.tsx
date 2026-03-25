interface BlocoProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dados: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (campo: string, valor: any) => void;
}

const TIPOS_ESTABILIDADE = [
  'Gestante',
  'Acidente de trabalho',
  'Doença ocupacional',
  'Retorno de afastamento pelo INSS (B91)',
  'Membro da CIPA (titular ou suplente)',
  'Dirigente sindical',
  'Pré-aposentadoria (convenção/acordo coletivo)',
  'Dispensa discriminatória',
  'Dispensa após retorno de licença médica',
  'Dispensa retaliatória (reclamações internas/sindicais)',
];

export const BlocoEstabilidades = ({ dados, onChange }: BlocoProps) => {
  const toggleEstabilidade = (tipo: string) => {
    const atuais: string[] = Array.isArray(dados.indicios_estabilidade) ? dados.indicios_estabilidade : [];
    if (atuais.includes(tipo)) {
      onChange('indicios_estabilidade', atuais.filter(t => t !== tipo));
    } else {
      onChange('indicios_estabilidade', [...atuais, tipo]);
    }
  };
  const estabilidadesSelecionadas: string[] = Array.isArray(dados.indicios_estabilidade) ? dados.indicios_estabilidade : [];

  return (
    <div>
      <div style={{ backgroundColor: '#f6ffed', padding: 20, borderRadius: 8, border: '1px solid #b7eb8f', marginBottom: 25 }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#389e0d', fontSize: '1.1rem' }}>Garantias Provisórias de Emprego</h4>
        <label style={{ fontSize: '0.95rem', fontWeight: 600, color: '#444', marginBottom: 15, display: 'block' }}>
          Marcar se há indício de estabilidade no caso concreto:
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          {TIPOS_ESTABILIDADE.map(tipo => (
            <label key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', backgroundColor: estabilidadesSelecionadas.includes(tipo) ? '#e6f7ff' : '#fff', borderColor: estabilidadesSelecionadas.includes(tipo) ? '#1890ff' : '#ddd', transition: 'all 0.2s' }}>
              <input type="checkbox" checked={estabilidadesSelecionadas.includes(tipo)} onChange={() => toggleEstabilidade(tipo)} style={{ transform: 'scale(1.2)' }} />
              <span style={{ fontSize: '0.95rem', color: '#333' }}>{tipo}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
