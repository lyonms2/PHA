"use client";

import { useState, useEffect } from 'react';
import { getCorRaridadeColecao, getBgRaridadeColecao } from '@/lib/collections/collectionDefinitions';

export default function ModalColecoes({ isOpen, onClose, userId }) {
  const [colecoes, setColecoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resgatando, setResgatando] = useState(null);
  const [modalRecompensa, setModalRecompensa] = useState(null);
  const [filtro, setFiltro] = useState('todas'); // 'todas', 'completas', 'incompletas'

  useEffect(() => {
    if (isOpen && userId) {
      carregarColecoes();
    }
  }, [isOpen, userId]);

  const carregarColecoes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/colecoes?userId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        setColecoes(data.colecoes || []);
      } else {
        console.error('Erro ao carregar coleções:', data.error);
      }
    } catch (error) {
      console.error('Erro ao carregar coleções:', error);
    } finally {
      setLoading(false);
    }
  };

  const resgatarColecao = async (colecaoId) => {
    if (resgatando) return;

    setResgatando(colecaoId);
    try {
      const response = await fetch('/api/colecoes/resgatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, colecaoId })
      });

      const data = await response.json();

      if (response.ok) {
        // Mostrar modal de recompensa
        setModalRecompensa(data);
        // Recarregar coleções
        await carregarColecoes();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao resgatar coleção:', error);
      alert('Erro ao resgatar coleção');
    } finally {
      setResgatando(null);
    }
  };

  if (!isOpen) return null;

  const colecoesFiltradas = colecoes.filter(c => {
    if (filtro === 'completas') return c.completa;
    if (filtro === 'incompletas') return !c.completa;
    return true;
  });

  const colecoesParaResgatar = colecoes.filter(c => c.podeResgatar).length;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        {/* Modal Content */}
        <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border-2 border-purple-500/50 shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-gradient-to-b from-slate-900 to-transparent p-6 border-b border-purple-500/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  📚 Coleções de Avatares
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Complete coleções temáticas e ganhe recompensas
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
              <button
                onClick={() => setFiltro('todas')}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  filtro === 'todas'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFiltro('completas')}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  filtro === 'completas'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Completas
              </button>
              <button
                onClick={() => setFiltro('incompletas')}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  filtro === 'incompletas'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Em Progresso
              </button>
              {colecoesParaResgatar > 0 && (
                <div className="ml-auto bg-green-600 text-white px-4 py-2 rounded-lg font-bold animate-pulse">
                  {colecoesParaResgatar} para resgatar!
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {loading ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4 animate-pulse">📚</div>
                <div className="text-slate-400">Carregando coleções...</div>
              </div>
            ) : colecoesFiltradas.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <div className="text-white text-xl mb-2">Nenhuma coleção neste filtro</div>
                <div className="text-slate-400">Tente outro filtro</div>
              </div>
            ) : (
              <div className="grid gap-4">
                {colecoesFiltradas.map((colecao) => (
                  <div
                    key={colecao.id}
                    className={`relative group rounded-lg p-6 border-2 transition-all ${
                      colecao.completa
                        ? 'border-green-500 bg-gradient-to-r from-green-900/30 to-emerald-900/30'
                        : 'border-slate-700 bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Ícone */}
                      <div className={`text-5xl ${colecao.completa ? '' : 'grayscale opacity-50'}`}>
                        {colecao.icone}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-white">
                            {colecao.nome}
                          </h3>
                          <span className={`text-sm font-bold ${getCorRaridadeColecao(colecao.raridade)}`}>
                            {colecao.raridade}
                          </span>
                          {colecao.completa && (
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                              ✓ Completa
                            </span>
                          )}
                        </div>

                        <p className="text-slate-400 text-sm mb-3">
                          {colecao.descricao}
                        </p>

                        {/* Progresso */}
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Progresso</span>
                            <span className="font-mono">{colecao.progresso}/{colecao.meta}</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all bg-gradient-to-r ${
                                colecao.completa
                                  ? 'from-green-500 to-emerald-500'
                                  : 'from-purple-500 to-pink-500'
                              }`}
                              style={{ width: `${colecao.percentual}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Recompensas */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <span>💰</span>
                            <span className="text-yellow-400">{colecao.recompensas.moedas}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>💎</span>
                            <span className="text-blue-400">{colecao.recompensas.fragmentos}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>⭐</span>
                            <span className="text-purple-400">{colecao.recompensas.xpCacador}</span>
                          </div>
                        </div>
                      </div>

                      {/* Botão Resgatar */}
                      {colecao.podeResgatar && (
                        <button
                          onClick={() => resgatarColecao(colecao.id)}
                          disabled={resgatando === colecao.id}
                          className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg font-bold transition-all disabled:opacity-50"
                        >
                          {resgatando === colecao.id ? '...' : 'Resgatar'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Recompensa */}
      {modalRecompensa && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setModalRecompensa(null)}
          ></div>

          <div className="relative z-10 w-full max-w-md">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-xl opacity-75 animate-pulse"></div>

            <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border-2 border-green-500/50 p-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">{modalRecompensa.colecao.icone}</div>
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2">
                  Coleção Completa!
                </h3>
                <p className="text-cyan-400">{modalRecompensa.colecao.nome}</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="bg-yellow-900/30 rounded-lg p-4 border border-yellow-600/30">
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-400">💰 Moedas</span>
                    <span className="text-2xl font-bold text-yellow-400">
                      +{modalRecompensa.recompensas.moedas}
                    </span>
                  </div>
                </div>

                <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-600/30">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400">💎 Fragmentos</span>
                    <span className="text-2xl font-bold text-blue-400">
                      +{modalRecompensa.recompensas.fragmentos}
                    </span>
                  </div>
                </div>

                <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-600/30">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-400">⭐ XP Caçador</span>
                    <span className="text-2xl font-bold text-purple-400">
                      +{modalRecompensa.recompensas.xpCacador}
                    </span>
                  </div>
                </div>

                {modalRecompensa.bonus_hunter_rank.percentual > 0 && (
                  <div className="bg-amber-900/20 rounded-lg p-3 text-center text-xs text-amber-400">
                    Bônus de Hunter Rank: {modalRecompensa.bonus_hunter_rank.rank} (+{modalRecompensa.bonus_hunter_rank.percentual}%)
                  </div>
                )}
              </div>

              <button
                onClick={() => setModalRecompensa(null)}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg font-bold transition-all"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
