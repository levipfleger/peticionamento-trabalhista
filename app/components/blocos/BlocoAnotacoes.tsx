interface BlocoAnotacoesProps {
  dados: any; // Usando 'dados' para manter o padrão do seu RenderAbaAtiva
  onChange: (campo: string, valor: any) => void;
}

export function BlocoAnotacoes({ dados, onChange }: BlocoAnotacoesProps) {
  return (
    <div className="space-y-6">
      
      <div className="flex flex-col">
        <label htmlFor="anotacoes_livres" className="mb-2 font-semibold text-gray-700">
          Anotações do Caso
        </label>
        <textarea
          id="anotacoes_livres"
          value={dados?.anotacoes_livres || ''}
          onChange={(e) => onChange('anotacoes_livres', e.target.value)}
          rows={10}
          placeholder="Insira aqui as anotações livres, estratégias, ou detalhes específicos do caso que não se encaixam nos outros blocos..."
          style={{ 
            width: '100%', 
            padding: '12px', 
            border: '1px solid #ccc', 
            borderRadius: '6px', 
            minHeight: '200px',
            fontFamily: 'inherit'
          }}
        />
      </div>
      
    </div>
  );
}