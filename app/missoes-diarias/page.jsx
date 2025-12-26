"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getHunterRank } from '@/lib/hunter/hunterRankSystem';
import { calcularRankPVP } from '@/lib/pvp/pvpRewardsSystem';

export default function MissoesDiariasPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missoes, setMissoes] = useState([]);
  const [playerStats, setPlayerStats] = useState(null);
  const [streakInfo, setStreakInfo] = useState({ atual: 0, proximo_marco: 3, progresso: 0 });
  const [coletando, setColetando] = useState(false);
  const [todasConcluidas, setTodasConcluidas] = useState(false);
  const [modalRecompensas, setModalRecompensas] = useState(null);

  useEffect(() => {
    const init = async () => {
      const userData = localStorage.getItem("user");
      if (!userData) {
        router.push("/login");
        return;
      }

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      await carregarMissoes(parsedUser.id);
      await carregarPlayerStats(parsedUser.id);

      setLoading(false);
    };

    init();
  }, [router]);

  const carregarMissoes = async (userId) => {
    try {
      const response = await fetch(`/api/missoes?userId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        setMissoes(data.missoes || []);
        setStreakInfo(data.streak || { atual: 0, proximo_marco: 3, progresso: 0 });
        setTodasConcluidas(data.todas_concluidas || false);
      } else {
        console.error('Erro ao carregar missões:', data.error);
      }
    } catch (error) {
      console.error('Erro ao carregar missões:', error);
    }
  };

  const carregarPlayerStats = async (userId) => {
    try {
      const response = await fetch(`/api/player-stats?userId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        setPlayerStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar stats:', error);
    }
  };

  const coletarRecompensas = async (missaoId = null) => {
    if (!user) return;

    setColetando(true);
    try {
      const response = await fetch('/api/missoes/coletar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          missaoId
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Recarregar missões e stats
        await carregarMissoes(user.id);
        await carregarPlayerStats(user.id);

        // Mostrar modal de recompensas
        setModalRecompensas(data);
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao coletar recompensas:', error);
      alert('Erro ao coletar recompensas');
    } finally {
      setColetando(false);
    }
  };

  const voltarDashboard = () => {
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse">Carregando missões diárias...</div>
      </div>
    );
  }

  const hunterRank = playerStats ? getHunterRank(playerStats.hunterRankXp || 0) : null;
  const rankPVP = playerStats ? calcularRankPVP(playerStats.fama || 0) : null;

  // Calcular progresso
  const missoesConcluidas = missoes.filter(m => m.concluida).length;
  const totalMissoes = missoes.length;
  const progressoPercentual = totalMissoes > 0 ? (missoesConcluidas / totalMissoes) * 100 : 0;

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-gray-100 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl top-20 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/5 rounded-full blur-3xl bottom-20 -right-48 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={voltarDashboard}
            className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2 font-mono text-sm group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>RETORNAR</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-cyan-400/50 font-mono">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
            <span>MISSÕES DIÁRIAS</span>
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Stats Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Hunter Rank */}
          {hunterRank && (
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-lg blur opacity-50"></div>
              <div className="relative bg-slate-900/80 backdrop-blur-xl border border-amber-900/30 rounded-lg p-4">
                <div className="text-xs text-slate-400 mb-1">Hunter Rank</div>
                <div className="text-2xl font-bold text-amber-400">{hunterRank.nome}</div>
                <div className="text-xs text-slate-400 mt-1">Bônus: +{Math.floor((hunterRank.multiplicador - 1) * 100)}%</div>
              </div>
            </div>
          )}

          {/* Streak */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg blur opacity-50"></div>
            <div className="relative bg-slate-900/80 backdrop-blur-xl border border-orange-900/30 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Sequência</div>
              <div className="text-2xl font-bold text-orange-400 flex items-center gap-2">
                🔥 {streakInfo.atual} {streakInfo.atual === 1 ? 'dia' : 'dias'}
              </div>
              {streakInfo.proximo_marco && (
                <div className="text-xs text-green-400 mt-1">Próximo marco: {streakInfo.proximo_marco} dias</div>
              )}
            </div>
          </div>

          {/* Progresso */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg blur opacity-50"></div>
            <div className="relative bg-slate-900/80 backdrop-blur-xl border border-green-900/30 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Progresso Diário</div>
              <div className="text-2xl font-bold text-green-400">{missoesConcluidas}/{totalMissoes}</div>
              <div className="w-full bg-slate-800 rounded-full h-2 mt-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressoPercentual}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Missões List */}
        <div className="space-y-4 mb-6">
          {missoes.map((missao) => {
            const progresso = missao.progresso || 0;
            const meta = missao.objetivo.quantidade || missao.objetivo.valor || missao.meta;
            const percentual = Math.min((progresso / meta) * 100, 100);

            // Classes Tailwind completas (não dinâmicas)
            const corGlow = missao.dificuldade === 'facil' ? 'bg-gradient-to-r from-green-500/20 to-green-600/20' :
                           missao.dificuldade === 'media' ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20' :
                           'bg-gradient-to-r from-red-500/20 to-red-600/20';

            const corBarra = missao.dificuldade === 'facil' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                            missao.dificuldade === 'media' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                            'bg-gradient-to-r from-red-500 to-red-600';

            return (
              <div key={missao.id_unico} className="relative group">
                <div className={`absolute -inset-0.5 ${corGlow} rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity`}></div>
                <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-lg p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{missao.icone}</span>
                        <div>
                          <h3 className="text-lg font-bold text-cyan-400">{missao.nome}</h3>
                          <p className="text-sm text-slate-400">{missao.descricao}</p>
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      missao.dificuldade === 'facil' ? 'bg-green-900/50 text-green-400' :
                      missao.dificuldade === 'media' ? 'bg-yellow-900/50 text-yellow-400' :
                      'bg-red-900/50 text-red-400'
                    }`}>
                      {missao.dificuldade.toUpperCase()}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Progresso</span>
                      <span className="font-mono">{progresso}/{meta}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3">
                      <div
                        className={`${corBarra} h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                        style={{ width: `${percentual}%` }}
                      >
                        {missao.concluida && (
                          <span className="text-white text-xs font-bold">✓</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rewards */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      {missao.recompensas.moedas > 0 && (
                        <div className="flex items-center gap-1">
                          <span>💰</span>
                          <span className="text-amber-400 font-mono">{missao.recompensas.moedas}</span>
                        </div>
                      )}
                      {missao.recompensas.fragmentos > 0 && (
                        <div className="flex items-center gap-1">
                          <span>💎</span>
                          <span className="text-blue-400 font-mono">{missao.recompensas.fragmentos}</span>
                        </div>
                      )}
                      {missao.recompensas.xpCacador > 0 && (
                        <div className="flex items-center gap-1">
                          <span>⭐</span>
                          <span className="text-purple-400 font-mono">{missao.recompensas.xpCacador}</span>
                        </div>
                      )}
                      {hunterRank && hunterRank.multiplicador > 1 && (
                        <div className="text-xs text-amber-400/70">
                          (+{Math.floor((hunterRank.multiplicador - 1) * 100)}% rank)
                        </div>
                      )}
                    </div>

                    {missao.concluida && !missao.coletada && (
                      <button
                        onClick={() => coletarRecompensas(missao.id_unico)}
                        disabled={coletando}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded font-bold hover:from-green-500 hover:to-emerald-500 transition-all disabled:opacity-50"
                      >
                        {coletando ? '...' : 'Coletar'}
                      </button>
                    )}
                    {missao.coletada && (
                      <div className="px-4 py-2 bg-slate-800 text-slate-500 rounded font-bold">
                        Coletada ✓
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Collect All Button */}
        {todasConcluidas && missoes.some(m => !m.coletada) && (
          <div className="relative group mb-6">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-lg blur opacity-75"></div>
            <div className="relative bg-slate-900/80 backdrop-blur-xl border border-purple-500/50 rounded-lg p-6 text-center">
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-3">
                🎉 Todas as Missões Concluídas!
              </h3>
              <p className="text-slate-300 mb-4">
                Você completou todas as missões diárias! Colete todas as recompensas de uma vez.
              </p>
              <button
                onClick={() => coletarRecompensas(null)}
                disabled={coletando}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold text-lg hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/50"
              >
                {coletando ? 'Coletando...' : 'Coletar Todas as Recompensas'}
              </button>
              {streakInfo.atual >= 3 && (
                <div className="mt-4 text-sm text-amber-400">
                  💫 Bônus de Streak será aplicado ao coletar!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg blur opacity-50"></div>
          <div className="relative bg-slate-900/80 backdrop-blur-xl border border-cyan-900/30 rounded-lg p-4">
            <h3 className="text-cyan-400 font-bold text-sm uppercase mb-2">ℹ️ Informações</h3>
            <div className="text-xs text-slate-400 space-y-1">
              <p>• As missões são renovadas diariamente</p>
              <p>• Complete todas as missões para ganhar bônus de streak</p>
              <p>• Streaks de 3, 7, 14 e 30 dias concedem recompensas especiais</p>
              <p>• Seu Hunter Rank aumenta as recompensas de missões</p>
              <p>• Progresso é rastreado automaticamente durante o jogo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Recompensas */}
      {modalRecompensas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setModalRecompensas(null)}
          ></div>

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-lg animate-scaleIn">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 rounded-2xl blur-xl opacity-75 animate-pulse"></div>

            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border-2 border-green-500/50 p-8 shadow-2xl">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2">
                  Recompensas Coletadas!
                </h2>
                <div className="text-cyan-400 font-mono text-sm">
                  {modalRecompensas.missoes_coletadas} {modalRecompensas.missoes_coletadas === 1 ? 'missão concluída' : 'missões concluídas'}
                </div>
              </div>

              {/* Recompensas */}
              <div className="space-y-3 mb-6">
                {/* Moedas */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-lg blur opacity-75"></div>
                  <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-lg p-4 border border-yellow-600/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">💰</span>
                        <div>
                          <div className="text-xs text-slate-400">Moedas</div>
                          <div className="text-2xl font-bold text-yellow-400">
                            +{modalRecompensas.recompensas.moedas.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      {modalRecompensas.bonus_hunter_rank?.percentual > 0 && (
                        <div className="text-xs text-amber-400/70 bg-amber-900/20 px-2 py-1 rounded">
                          +{modalRecompensas.bonus_hunter_rank.percentual}% rank
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Fragmentos */}
                {modalRecompensas.recompensas.fragmentos > 0 && (
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg blur opacity-75"></div>
                    <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-lg p-4 border border-blue-600/30">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">💎</span>
                        <div>
                          <div className="text-xs text-slate-400">Fragmentos</div>
                          <div className="text-2xl font-bold text-blue-400">
                            +{modalRecompensas.recompensas.fragmentos}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* XP Caçador */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg blur opacity-75"></div>
                  <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-lg p-4 border border-purple-600/30">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">⭐</span>
                      <div>
                        <div className="text-xs text-slate-400">XP de Caçador</div>
                        <div className="text-2xl font-bold text-purple-400">
                          +{modalRecompensas.recompensas.xpCacador}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Streak Bonus */}
                {modalRecompensas.streak && (
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/30 to-red-500/30 rounded-lg blur opacity-75 animate-pulse"></div>
                    <div className="relative bg-gradient-to-r from-orange-900/40 to-red-900/40 backdrop-blur-xl rounded-lg p-4 border-2 border-orange-500">
                      <div className="text-center">
                        <div className="text-3xl mb-2">🔥</div>
                        <div className="text-orange-400 font-bold text-lg">
                          Streak de {modalRecompensas.streak.dias_consecutivos} dias!
                        </div>
                        {modalRecompensas.streak.recompensa_extra && (
                          <div className="text-sm text-orange-300 mt-2">
                            {modalRecompensas.streak.recompensa_extra.mensagem}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Hunter Rank Info */}
                {modalRecompensas.bonus_hunter_rank && (
                  <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-3 text-center">
                    <div className="text-xs text-amber-400">
                      Bônus de Hunter Rank: <span className="font-bold">{modalRecompensas.bonus_hunter_rank.rank}</span>
                      {modalRecompensas.bonus_hunter_rank.percentual > 0 && (
                        <span> (+{modalRecompensas.bonus_hunter_rank.percentual}%)</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Botão Fechar */}
              <button
                onClick={() => setModalRecompensas(null)}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
