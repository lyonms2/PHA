"use client";

import { useState, useEffect } from 'react';
import { getCorRaridadeColecao, getBgRaridadeColecao } from '@/lib/collections/collectionDefinitions';

export default function ModalColecoes({ isOpen, onClose, userId }) {
  const [colecoes, setColecoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas'); // 'todas', 'ativas', 'inativas'

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

  if (!isOpen) return null;

  const colecoesFiltradas = colecoes.filter(c => {
    if (filtro === 'ativas') return c.ativa;
    if (filtro === 'inativas') return !c.ativa;
    return true;
  });

  const colecoesAtivas = colecoes.filter(c => c.ativa).length;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        {/* Modal Content */}
        <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl border-2 border-slate-700/50 shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-gradient-to-b from-slate-900 to-transparent p-6 border-b border-slate-700/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  📚 Coleções de Avatares
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Coleções completas concedem bônus de Gold e XP em batalhas
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
                    ? 'bg-cyan-700 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFiltro('ativas')}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  filtro === 'ativas'
                    ? 'bg-cyan-700 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Ativas
              </button>
              <button
                onClick={() => setFiltro('inativas')}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  filtro === 'inativas'
                    ? 'bg-cyan-700 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Inativas
              </button>
              {colecoesAtivas > 0 && (
                <div className="ml-auto bg-green-600 text-white px-4 py-2 rounded-lg font-bold">
                  {colecoesAtivas} ativa{colecoesAtivas > 1 ? 's' : ''}!
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
            ) : (
              <>
                {/* Resumo de Bônus Ativos */}
                {colecoesAtivas > 0 && (
                  <div className="mb-6 bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-2 border-green-500/50 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-green-300 mb-3 flex items-center gap-2">
                      ✨ Bônus Ativos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(() => {
                        let totalGoldBonus = 0;
                        const xpBonusPorElemento = {};

                        colecoes.filter(c => c.ativa).forEach(colecao => {
                          const bonusArray = Array.isArray(colecao.bonus) ? colecao.bonus : [colecao.bonus];
                          bonusArray.forEach(b => {
                            if (b.tipo === 'GOLD_BONUS') {
                              totalGoldBonus += b.valor;
                            } else if (b.tipo === 'XP_BONUS' && b.elementoRequerido) {
                              if (!xpBonusPorElemento[b.elementoRequerido] || xpBonusPorElemento[b.elementoRequerido] < b.valor) {
                                xpBonusPorElemento[b.elementoRequerido] = b.valor;
                              }
                            }
                          });
                        });

                        return (
                          <>
                            {totalGoldBonus > 0 && (
                              <div className="bg-slate-900/50 rounded-lg p-3 border border-green-500/30">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">💰</span>
                                  <div>
                                    <div className="text-xs text-slate-400">Bônus de Gold Total</div>
                                    <div className="text-xl font-bold text-yellow-400">+{totalGoldBonus}%</div>
                                  </div>
                                </div>
                              </div>
                            )}
                            {Object.keys(xpBonusPorElemento).length > 0 && (
                              <div className="bg-slate-900/50 rounded-lg p-3 border border-green-500/30">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">✨</span>
                                  <div className="flex-1">
                                    <div className="text-xs text-slate-400 mb-1">Bônus de XP por Elemento</div>
                                    <div className="flex flex-wrap gap-1">
                                      {Object.entries(xpBonusPorElemento).map(([elemento, valor]) => (
                                        <span key={elemento} className="text-xs bg-slate-800 px-2 py-1 rounded text-cyan-300">
                                          {elemento}: +{valor}%
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {colecoesFiltradas.length === 0 ? (
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
                      colecao.ativa
                        ? 'border-green-500 bg-gradient-to-r from-green-900/30 to-emerald-900/30'
                        : 'border-slate-700 bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Ícone */}
                      <div className={`text-5xl ${colecao.ativa ? '' : 'grayscale opacity-50'}`}>
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
                          {colecao.ativa && (
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                              ✓ Ativa
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
                                colecao.ativa
                                  ? 'from-green-500 to-emerald-500'
                                  : 'from-cyan-600 to-blue-600'
                              }`}
                              style={{ width: `${colecao.percentual}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Bônus */}
                        {colecao.bonus && (
                          <div className={`p-3 rounded-lg space-y-2 ${
                            colecao.ativa
                              ? 'bg-green-900/30 border border-green-600/30'
                              : 'bg-slate-700/30 border border-slate-600/30'
                          }`}>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-amber-400 font-bold">🎁 BÔNUS:</span>
                            </div>
                            {Array.isArray(colecao.bonus) ? (
                              // Múltiplos bônus (Lendários)
                              colecao.bonus.map((b, idx) => (
                                <div key={idx} className={`flex items-center gap-2 text-sm ${colecao.ativa ? 'text-green-300' : 'text-slate-400'}`}>
                                  <span className="text-lg">{b.tipo === 'GOLD_BONUS' ? '💰' : b.tipo === 'XP_BONUS' ? '✨' : '⚔️'}</span>
                                  <span>{b.descricao}</span>
                                </div>
                              ))
                            ) : (
                              // Bônus único (Raros)
                              <div className={`flex items-center gap-2 text-sm ${colecao.ativa ? 'text-green-300' : 'text-slate-400'}`}>
                                <span className="text-lg">{colecao.bonus.tipo === 'GOLD_BONUS' ? '💰' : colecao.bonus.tipo === 'XP_BONUS' ? '✨' : '⚔️'}</span>
                                <span>{colecao.bonus.descricao}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
                </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
