"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPremiacaoTier, getRankIcon, getPosicaoColor } from './utils';

export default function LeaderboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [meuRanking, setMeuRanking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [temporadaInfo, setTemporadaInfo] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    carregarTemporada();
    carregarRankings(parsedUser.id);
  }, [router]);

  const carregarTemporada = async () => {
    try {
      const response = await fetch('/api/pvp/temporada');
      const data = await response.json();

      if (response.ok && data.temporada) {
        setTemporadaInfo(data.temporada);
      }
    } catch (error) {
      console.error("Erro ao carregar temporada:", error);
    }
  };

  const carregarRankings = async (userId) => {
    try {
      const response = await fetch(`/api/pvp/leaderboard?userId=${userId}&limit=100`);
      const data = await response.json();

      if (response.ok) {
        setRankings(data.leaderboard || []);

        // Verificar se usuário está no top retornado
        if (data.jogadorNoTop) {
          const meuDados = data.leaderboard?.find(r => r.user_id === userId);
          if (meuDados) {
            setMeuRanking(meuDados);
          }
        } else if (data.posicaoJogador) {
          // Usuário não está no top, mas temos sua posição
          setMeuRanking({
            posicao: data.posicaoJogador,
            user_id: userId,
            fama: 0, // Dados básicos - não está no top 100
            vitorias: 0,
            derrotas: 0,
            streak: 0
          });
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar rankings:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse text-xl">
          Carregando Leaderboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-gray-100 p-3 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/arena/pvp')}
            className="text-cyan-400 hover:text-cyan-300 mb-4 flex items-center gap-2"
          >
            ← Voltar para Arena PVP
          </button>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 mb-2">
            🏆 LEADERBOARD
          </h1>
          <p className="text-gray-400 text-lg">
            {temporadaInfo ? temporadaInfo.nome : 'Rankings da Temporada Atual'}
          </p>
          {temporadaInfo && temporadaInfo.diasRestantes !== undefined && (
            <p className="text-slate-500 text-sm mt-1">
              Encerra em {temporadaInfo.diasRestantes} dias
            </p>
          )}
        </div>

        {/* Meu Ranking */}
        {meuRanking && (
          <div className="bg-gradient-to-br from-cyan-900/30 to-slate-900 border-2 border-cyan-500 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-cyan-400 mb-4">📊 Sua Classificação</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-gray-400 text-sm">Posição</div>
                <div className="text-3xl font-black text-cyan-400">{getRankIcon(meuRanking.posicao)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Fama</div>
                <div className="text-2xl font-bold text-yellow-400">{meuRanking.fama}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Vitórias / Derrotas</div>
                <div className="text-xl font-bold">
                  <span className="text-green-400">{meuRanking.vitorias}</span>
                  <span className="text-gray-500"> / </span>
                  <span className="text-red-400">{meuRanking.derrotas}</span>
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Sequência</div>
                <div className="text-2xl font-bold text-orange-400">
                  {meuRanking.streak > 0 ? `🔥 ${meuRanking.streak}` : meuRanking.streak}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Premiações da Temporada */}
        <div className="bg-slate-900 border border-yellow-500/30 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">💰 Premiações da Temporada</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-yellow-900/30 to-slate-950 border border-yellow-500 rounded-lg p-4 text-center">
              <div className="text-4xl mb-2">🥇</div>
              <div className="text-yellow-400 font-bold text-lg mb-2">1º Lugar</div>
              <div className="text-sm text-gray-300">1000 Moedas + 100 Fragmentos</div>
              <div className="text-xs text-yellow-300">Título: "Campeão Lendário"</div>
              <div className="text-xs text-purple-400 mt-1">+ Avatar Lendário</div>
            </div>
            <div className="bg-gradient-to-br from-gray-700/30 to-slate-950 border border-gray-300 rounded-lg p-4 text-center">
              <div className="text-4xl mb-2">🥈</div>
              <div className="text-gray-300 font-bold text-lg mb-2">2º Lugar</div>
              <div className="text-sm text-gray-300">500 Moedas + 50 Fragmentos</div>
              <div className="text-xs text-gray-400">Título: "Guerreiro Épico"</div>
              <div className="text-xs text-blue-400 mt-1">+ Avatar Raro</div>
            </div>
            <div className="bg-gradient-to-br from-orange-900/30 to-slate-950 border border-orange-600 rounded-lg p-4 text-center">
              <div className="text-4xl mb-2">🥉</div>
              <div className="text-orange-600 font-bold text-lg mb-2">3º Lugar</div>
              <div className="text-sm text-gray-300">250 Moedas + 30 Fragmentos</div>
              <div className="text-xs text-orange-400">Título: "Lutador Raro"</div>
              <div className="text-xs text-blue-400 mt-1">+ Avatar Raro</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-purple-500/30 rounded p-3 text-center">
              <div className="text-purple-400 font-bold">Top 4-10</div>
              <div className="text-sm text-gray-400">100 Moedas + 20 Fragmentos</div>
              <div className="text-xs text-slate-500 mt-1">+ Título Especial</div>
            </div>
            <div className="bg-slate-950 border border-blue-500/30 rounded p-3 text-center">
              <div className="text-blue-400 font-bold">Top 11-50</div>
              <div className="text-sm text-gray-400">50 Moedas + 10 Fragmentos</div>
            </div>
          </div>
        </div>

        {/* Ranking Geral */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-6">📋 Ranking Geral</h2>

          {rankings.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              Nenhum jogador no ranking ainda
            </div>
          ) : (
            <div className="space-y-2">
              {rankings.map((rank, index) => {
                const posicao = index + 1;
                const premiacao = getPremiacaoTier(posicao);
                const isUsuario = rank.user_id === user?.id;

                return (
                  <div
                    key={rank.user_id}
                    className={`bg-slate-950 border rounded-lg p-4 transition-all ${
                      isUsuario
                        ? 'border-cyan-500 bg-cyan-950/20'
                        : posicao <= 3
                          ? 'border-yellow-500/30'
                          : 'border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Posição */}
                      <div className={`text-2xl font-black w-16 text-center ${getPosicaoColor(posicao)}`}>
                        {getRankIcon(posicao)}
                      </div>

                      {/* Nome */}
                      <div className="flex-1">
                        <div className="font-bold text-white">
                          {rank.nome || 'Caçador Misterioso'}
                          {isUsuario && <span className="text-cyan-400 ml-2">(Você)</span>}
                        </div>
                        <div className={`text-sm ${premiacao.cor}`}>{premiacao.tier}</div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-xs text-gray-400">Fama</div>
                          <div className="text-yellow-400 font-bold">{rank.fama}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400">V / D</div>
                          <div className="text-sm">
                            <span className="text-green-400">{rank.vitorias}</span>
                            <span className="text-gray-500">/</span>
                            <span className="text-red-400">{rank.derrotas}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400">Win Rate</div>
                          <div className="text-cyan-400 font-bold text-sm">
                            {rank.win_rate ? `${rank.win_rate}%` : '0%'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400">Streak</div>
                          <div className="text-orange-400 font-bold">
                            {rank.streak > 0 ? `🔥${rank.streak}` : rank.streak}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info sobre Temporadas */}
        <div className="mt-6 bg-slate-900/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-lg font-bold text-cyan-400 mb-2">ℹ️ Sobre as Temporadas</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• As temporadas duram 30 dias</li>
            <li>• Ao final da temporada, os rankings são resetados e as recompensas distribuídas</li>
            <li>• Títulos conquistados são permanentes</li>
            <li>• A fama determina sua posição no ranking</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
