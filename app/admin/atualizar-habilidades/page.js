'use client';

import { useState } from 'react';

export default function AtualizarHabilidadesPage() {
  const [resultado, setResultado] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const executarAtualizacao = async () => {
    setCarregando(true);
    setErro(null);
    setResultado(null);

    try {
      const response = await fetch('/api/admin/atualizar-habilidades');
      const data = await response.json();

      if (data.sucesso) {
        setResultado(data);
      } else {
        setErro(data.erro || 'Erro desconhecido');
      }
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>🔧 Atualizar Habilidades dos Avatares</h1>

      <div style={{
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px'
      }}>
        <h2 style={{ fontSize: '18px', marginTop: 0 }}>⚠️ Atenção</h2>
        <p>Esta operação irá atualizar as descrições e propriedades de todas as habilidades dos avatares no banco de dados para corresponder aos arquivos mais recentes do código.</p>
        <p style={{ marginBottom: 0 }}>Isso inclui as alterações recentes em:</p>
        <ul>
          <li>Elemento Fogo (Explosão de Chamas)</li>
          <li>Elemento Sombra (Véu das Sombras, Garras Sombrias)</li>
          <li>Elemento Void (Campo de Anulação, Ruptura Dimensional)</li>
          <li>Todos os outros elementos</li>
        </ul>
      </div>

      <button
        onClick={executarAtualizacao}
        disabled={carregando}
        style={{
          backgroundColor: carregando ? '#6c757d' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '15px 30px',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: carregando ? 'not-allowed' : 'pointer',
          marginBottom: '30px',
          transition: 'background-color 0.2s'
        }}
      >
        {carregando ? '🔄 Atualizando...' : '▶️ Executar Atualização'}
      </button>

      {erro && (
        <div style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c2c7',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ fontSize: '20px', marginTop: 0, color: '#842029' }}>❌ Erro</h3>
          <p style={{ marginBottom: 0, color: '#842029' }}>{erro}</p>
        </div>
      )}

      {resultado && (
        <div style={{
          backgroundColor: '#d1e7dd',
          border: '1px solid #badbcc',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{ fontSize: '20px', marginTop: 0, color: '#0f5132' }}>✅ Atualização Concluída!</h3>
          <div style={{ color: '#0f5132' }}>
            <p><strong>Total de avatares:</strong> {resultado.totalAvatares}</p>
            <p><strong>Avatares atualizados:</strong> {resultado.avatarsAtualizados}</p>
            <p><strong>Habilidades atualizadas:</strong> {resultado.habilidadesAtualizadas}</p>

            {resultado.erros && resultado.erros.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <h4 style={{ fontSize: '16px' }}>⚠️ Erros encontrados:</h4>
                <ul>
                  {resultado.erros.map((erro, index) => (
                    <li key={index}>
                      <strong>{erro.avatar}:</strong> {erro.erro}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {!resultado && !erro && !carregando && (
        <div style={{
          backgroundColor: '#cfe2ff',
          border: '1px solid #b6d4fe',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{ fontSize: '18px', marginTop: 0, color: '#084298' }}>ℹ️ Informações</h3>
          <p style={{ marginBottom: 0, color: '#084298' }}>
            Clique no botão acima para iniciar a atualização. O processo pode levar alguns segundos dependendo do número de avatares no banco de dados.
          </p>
        </div>
      )}
    </div>
  );
}
